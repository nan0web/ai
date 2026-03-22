#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

import fs from 'node:fs/promises'
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

async function initDatabases() {
	if (databases.size > 0) return // Already loaded

	const toLoad = []
	const addProject = (name, dir) => {
		const indexPath = path.join(dir, '.datasets', 'workspace-index.bin')
		toLoad.push({ name, indexPath })
	}

	// 1. Root
	addProject('Platform Root', workspaceRoot)

	// 2. Apps
	try {
		const appsDir = path.join(workspaceRoot, 'apps')
		const apps = await fs.readdir(appsDir, { withFileTypes: true }).catch(() => [])
		for (const app of apps) {
			if (app.isDirectory() && !app.name.startsWith('.'))
				addProject(`App: ${app.name}`, path.join(appsDir, app.name))
		}
	} catch (e) {}

	// 3. Packages
	try {
		const pkgsDir = path.join(workspaceRoot, 'packages')
		const pkgs = await fs.readdir(pkgsDir, { withFileTypes: true }).catch(() => [])
		for (const pkg of pkgs) {
			if (pkg.isDirectory() && !pkg.name.startsWith('.'))
				addProject(`Package: ${pkg.name}`, path.join(pkgsDir, pkg.name))
		}
	} catch (e) {}

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
	{ name: 'nan0web-knowledge', version: '1.2.0' },
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
					},
					required: ['query'],
				},
			},
		],
	}
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	if (request.params.name === 'search_knowledge_base') {
		const args = request.params.arguments || {}
		const query = args.query
		const targetProjects = args.projects
		const k = args.k || 5

		try {
			await initDatabases()
			const vec = await embedder.embed('query: ' + query)

			let allResults = []

			for (const [name, vdb] of databases.entries()) {
				if (targetProjects && !targetProjects.includes(name)) continue
				const res = vdb.search(vec, k)
				for (const r of res) {
					allResults.push({ project: name, ...r })
				}
			}

			// Sort globally by distance (lower is better for HNSW usually)
			allResults.sort((a, b) => a.distance - b.distance)
			const topResults = allResults.slice(0, k)

			if (topResults.length === 0) {
				return {
					content: [{ type: 'text', text: 'No relevant information found in the knowledge base.' }],
				}
			}

			const resultsText = topResults
				.map(
					(r) =>
						`--- [Project: ${r.project}] [File: ${r.file || 'Unknown'} (Dist: ${r.distance.toFixed(3)})] ---\n${r.content}`,
				)
				.join('\n\n')

			return { content: [{ type: 'text', text: resultsText }] }
		} catch (err) {
			return { content: [{ type: 'text', text: `Error during retrieval: ${err.message}` }] }
		}
	}
	return { content: [{ type: 'text', text: 'Unknown tool' }] }
})

const transport = new StdioServerTransport()
server.connect(transport).catch(console.error)
