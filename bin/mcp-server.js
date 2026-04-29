#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Embedder } from '../src/domain/Embedder.js'
import { VectorDB } from '../src/domain/VectorDB.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkgRoot = path.join(__dirname, '../')
const workspaceRoot = path.join(pkgRoot, '../../')

const embedder = new Embedder({ baseURL: process.env.EMBEDDER_URL || 'http://localhost:1234/v1' })

/** @type {Map<string, VectorDB>} */
const databases = new Map()
/** @type {Map<string, string>} */
const packagePaths = new Map()

async function initDatabases() {
	if (databases.size > 0) return // Already loaded

	const toLoad = []
	const addProject = (name, dir) => {
		const indexPath = path.join(dir, '.datasets', 'workspace-index.bin')
		toLoad.push({ name, indexPath })
		packagePaths.set(name, dir)
	}

	// Load projects from nan0web_store.csv and nan0web_store.local.csv
	const storeDir = path.join(os.homedir(), '.nan0web/store')
	const stores = ['nan0web_store.csv', 'nan0web_store.local.csv']
	for (const store of stores) {
		try {
			const storePath = path.join(storeDir, store)
			const csvContent = await fs.readFile(storePath, 'utf8')
			const lines = csvContent
				.split('\n')
				.filter((l) => l.trim())
				.slice(1)
			for (const line of lines) {
				const parts = line.split(',')
				if (parts.length >= 3) {
					const name = parts[0].replace(/"/g, '').trim()
					const relPath = parts[2].replace(/"/g, '').trim()
					const absPath = path.resolve(workspaceRoot, relPath)
					if (name && absPath) addProject(name, absPath)
				}
			}
		} catch (e) {
			// Skip if file doesn't exist
		}
	}

	if (toLoad.length === 0) {
		addProject('Platform Root', workspaceRoot)
	}

	// Try loading each
	for (const p of toLoad) {
		const vdb = new VectorDB({ dim: 1024 })
		const ok = await vdb.load(p.indexPath)
		if (ok) {
			databases.set(p.name, vdb)
		}
	}
}

const server = new Server(
	{ name: 'nan0web-knowledge', version: '1.4.2' },
	{ capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
	await initDatabases()
	return {
		tools: [
			{
				name: 'search_knowledge_base',
				description: `Searches the nan0web workspace Markdown knowledge base. Available indices: ${Array.from(databases.keys()).join(', ')}. Returns relevant snippets of related files.`,
				inputSchema: {
					type: 'object',
					properties: {
						query: {
							type: 'string',
							description: 'The search query (e.g. "how to setup workflow").',
						},
						projects: {
							type: 'array',
							items: { type: 'string' },
							description:
								'Optional array of project names to search within. If omitted, searches all available indices.',
						},
						k: {
							type: 'number',
							description: 'Number of results to return (default 5)',
						},
						max_distance: {
							type: 'number',
							description: 'Maximum distance threshold (default 0.18).',
						},
					},
					required: ['query'],
				},
			},
			{
				name: 'get_resource',
				description:
					'Retrieves a source file or documentation by logical path (e.g. @nan0web/ui/src/index.js) or relative path within a package.',
				inputSchema: {
					type: 'object',
					properties: {
						path: {
							type: 'string',
							description: 'The logical or relative path to the resource.',
						},
					},
					required: ['path'],
				},
			},
		],
	}
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	await initDatabases()
	const args = request.params.arguments || {}

	if (request.params.name === 'search_knowledge_base') {
		const query = args.query
		const targetProjects = args.projects
		const k = args.k || 10
		const maxDistance = args.max_distance || 0.18

		try {
			const instructPrefix =
				'Instruct: Retrieve relevant documentation, workflows, and architectural details to assist the software engineer.\nQuery: '
			const vec = await embedder.embed(instructPrefix + query)

			let allResults = []

			for (const [name, vdb] of databases.entries()) {
				if (targetProjects && !targetProjects.includes(name)) continue
				const fetchCount = Math.max(k * 10, 100)
				const res = vdb.search(vec, fetchCount)
				for (const r of res) {
					if (r.distance <= maxDistance) {
						allResults.push({ project: name, ...r })
					}
				}
			}

			allResults.sort((a, b) => a.distance - b.distance)

			const seenFiles = new Set()
			const topResults = []
			for (const r of allResults) {
				const uniqueKey = r.project + ':' + r.file
				if (!seenFiles.has(uniqueKey)) {
					seenFiles.add(uniqueKey)
					topResults.push(r)
					if (topResults.length === k) break
				}
			}

			if (topResults.length === 0) {
				return {
					content: [{ type: 'text', text: 'No relevant information found in the knowledge base.' }],
				}
			}

			let resultsText = ''
			for (const r of topResults) {
				let startLine = '?'
				let endLine = '?'
				try {
					const absPath = path.join(workspaceRoot, r.file || '')
					const fullText = await fs.readFile(absPath, 'utf8')
					const idx = fullText.indexOf(r.content)
					if (idx !== -1) {
						startLine = fullText.substring(0, idx).split('\n').length
						endLine = startLine + r.content.split('\n').length - 1
					}
				} catch (e) {}

				resultsText += `────────────────────────────────────────\n`
				resultsText += `📦 Package: ${r.project} | 📄 File: ${r.file || 'Unknown'} | 📝 Lines: ${startLine}-${endLine} | Dist: ${r.distance.toFixed(3)}\n`
				resultsText += `────────────────────────────────────────\n`
				resultsText += `${r.content}\n\n`
			}

			return { content: [{ type: 'text', text: resultsText }] }
		} catch (err) {
			return { content: [{ type: 'text', text: `Error during retrieval: ${err.message}` }] }
		}
	}

	if (request.params.name === 'get_resource') {
		const filePath = args.path
		try {
			let resolvedPath = filePath
			if (filePath.startsWith('@')) {
				const pkgName = filePath.split('/').slice(0, 2).join('/')
				const subPath = filePath.split('/').slice(2).join('/')
				const baseDir = packagePaths.get(pkgName)
				if (baseDir) {
					resolvedPath = path.join(baseDir, subPath)
				}
			} else if (!path.isAbsolute(filePath)) {
				resolvedPath = path.join(workspaceRoot, filePath)
			}

			const content = await fs.readFile(resolvedPath, 'utf8')
			return {
				content: [{ type: 'text', text: content }],
			}
		} catch (err) {
			return {
				content: [{ type: 'text', text: `Failed to read file ${filePath}: ${err.message}` }],
			}
		}
	}

	return { content: [{ type: 'text', text: 'Unknown tool' }] }
})

const transport = new StdioServerTransport()
server.connect(transport).catch(console.error)
