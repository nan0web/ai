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

// The workspace-index.bin path (global for nan.web)
const pkgRoot = path.join(__dirname, '../')
const workspaceRoot = path.join(pkgRoot, '../../')
const dsFolder = path.join(workspaceRoot, '.datasets')
const indexPath = path.join(dsFolder, 'workspace-index.bin')

const embedder = new Embedder({ baseURL: process.env.EMBEDDER_URL || 'http://localhost:1234/v1' })
const vdb = new VectorDB({ dim: 1024 }) // multilingual-e5-large-instruct outputs 1024 dim

async function initDB() {
	await fs.mkdir(dsFolder, { recursive: true }).catch(() => {})
	await vdb.load(indexPath)
}

const server = new Server(
	{ name: 'nan0web-knowledge', version: '1.2.0' },
	{ capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: 'search_knowledge_base',
				description: 'Searches the nan0web workspace Markdown knowledge base for documentation, architecture patterns, and workflows. ALWAYS use this tool before making architectural decisions or creating files. Returns relevant snippets of related files.',
				inputSchema: {
					type: 'object',
					properties: {
						query: {
							type: 'string',
							description: 'The search query (e.g. "how to setup workflow").'
						},
						k: {
							type: 'number',
							description: 'Number of results to return (default 5)'
						}
					},
					required: ['query']
				}
			}
		]
	}
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	if (request.params.name === 'search_knowledge_base') {
		const args = request.params.arguments || {}
		const query = args.query
		const k = args.k || 5

		try {
			await initDB()
			
			// Generate query embedding
			const vec = await embedder.embed(query)
			
			// Find nearest chunks
			const res = vdb.search(vec, k)
			
			if (res.length === 0) {
				return { content: [{ type: 'text', text: 'No relevant information found in the knowledge base.' }] }
			}

			const resultsText = res.map(r => `--- [File: ${r.file || 'Unknown'} (Similarity Dist: ${r.distance.toFixed(3)})] ---\n${r.content}`).join('\n\n')
			
			return {
				content: [{ type: 'text', text: resultsText }]
			}
		} catch (err) {
			return { content: [{ type: 'text', text: `Error during retrieval: ${err.message}` }] }
		}
	}
	return { content: [{ type: 'text', text: 'Unknown tool' }] }
})

const transport = new StdioServerTransport()
server.connect(transport).catch(console.error)
