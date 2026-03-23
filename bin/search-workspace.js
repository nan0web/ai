#!/usr/bin/env node

/**
 * search-workspace.js — CLI tool to query the HNSW vector indices manually.
 *
 * Usage:
 * Usage:
 *   node bin/search-workspace.js "query text" [--project "App: willni"] [-k 10] [-d 0.15]
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Embedder } from '../src/domain/Embedder.js'
import { VectorDB } from '../src/domain/VectorDB.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkgRoot = path.join(__dirname, '../')
const workspaceRoot = path.join(pkgRoot, '../../')

const EMBEDDER_URL = process.env.EMBEDDER_URL || 'http://localhost:1234/v1'
const embedder = new Embedder({ baseURL: EMBEDDER_URL })

/** @type {Map<string, VectorDB>} */
const databases = new Map()

async function initDatabases() {
	const toLoad = []
	const addProject = (name, dir) => {
		const indexPath = path.join(dir, '.datasets', 'workspace-index.bin')
		toLoad.push({ name, indexPath })
	}

	addProject('Platform Root', workspaceRoot)
	
	try {
		const appsDir = path.join(workspaceRoot, 'apps')
		const apps = await fs.readdir(appsDir, { withFileTypes: true }).catch(() => [])
		for (const app of apps) {
			if (app.isDirectory() && !app.name.startsWith('.')) addProject(`App: ${app.name}`, path.join(appsDir, app.name))
		}
	} catch(e) {}

	try {
		const pkgsDir = path.join(workspaceRoot, 'packages')
		const pkgs = await fs.readdir(pkgsDir, { withFileTypes: true }).catch(() => [])
		for (const pkg of pkgs) {
			if (pkg.isDirectory() && !pkg.name.startsWith('.')) addProject(`Package: ${pkg.name}`, path.join(pkgsDir, pkg.name))
		}
	} catch(e) {}

	for (const p of toLoad) {
		const vdb = new VectorDB({ dim: 1024 })
		const ok = await vdb.load(p.indexPath)
		if (ok) databases.set(p.name, vdb)
	}
}

async function main() {
	const args = process.argv.slice(2)

	if (args.includes('--help') || args.includes('-h')) {
		console.log(`
\x1b[36m@nan0web/ai Workspace Search\x1b[0m

Queries the HNSW vector indices manually from the CLI.

\x1b[33mUsage:\x1b[0m
  node bin/search-workspace.js "query text" [options]

\x1b[33mOptions:\x1b[0m
  -p, --project <name>   Filter by project name(s). Supports comma-separated
                         patterns matched as substrings (case-insensitive).
                         Example: -p "ui,0HCnAI" matches all ui-* + 0HCnAI.framework.
  -k <number>            Number of results to return (default: 10).
  -d, --max-distance <n> Maximum distance threshold (default: 0.15).
                         Values >0.15 typically indicate garbage for E5 models.
  -l, --list             List all available indexed projects.
  -h, --help             Show this help message.
`)
		process.exit(0)
	}

	if (args.includes('--list') || args.includes('-l')) {
		await initDatabases()
		console.log(`\n\x1b[36m📚 Available Indices (${databases.size}):\x1b[0m`)
		
		const names = Array.from(databases.keys()).sort()
		for (const name of names) {
			console.log(`  - \x1b[32m${name}\x1b[0m`)
		}
		console.log()
		process.exit(0)
	}

	let query = ''
	/** @type {string[]} */
	let projectPatterns = []
	let k = 10
	let maxDistance = 0.15

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--project' || args[i] === '-p') {
			const val = args[++i] || ''
			projectPatterns.push(...val.split(',').map(s => s.trim().toLowerCase()).filter(Boolean))
		} else if (args[i] === '-k') {
			k = parseInt(args[++i], 10)
		} else if (args[i] === '--max-distance' || args[i] === '-d') {
			maxDistance = parseFloat(args[++i])
		} else if (!args[i].startsWith('-')) {
			query = args[i]
		}
	}

	if (!query) {
		console.error('\x1b[31mError: Missing query.\x1b[0m')
		console.error('Usage: node search-workspace.js "query text" [--project "App: willni"] [-k 10] [-d 0.15]')
		process.exit(1)
	}

	console.log(`\x1b[36m🔍 Query: "${query}"\x1b[0m`)
	console.log(`\x1b[36m🔗 Embedder: ${EMBEDDER_URL}\x1b[0m`)
	
	await initDatabases()
	if (databases.size === 0) {
		console.error('\x1b[31mError: No indices found. Run `npm run index` first.\x1b[0m')
		process.exit(1)
	}

	console.log(`\x1b[36m📚 Loaded ${databases.size} indices. Searching...\x1b[0m\n`)

	try {
		// E5 models require 'query: ' prefix for similarity search vectors
		const instructPrefix = 'Instruct: Retrieve relevant documentation, workflows, and architectural details to assist the software engineer.\nQuery: '
	const vec = await embedder.embed(instructPrefix + query)
		let allResults = []
		
		for (const [name, vdb] of databases.entries()) {
			if (projectPatterns.length > 0) {
				const nameLower = name.toLowerCase()
				if (!projectPatterns.some(p => nameLower.includes(p))) continue
			}
			// Fetch more to survive deduplication filtering
			const fetchCount = Math.max(k * 10, 100)
			const res = vdb.search(vec, fetchCount)
			for (const r of res) {
				if (r.distance <= maxDistance) {
					allResults.push({ project: name, ...r })
				}
			}
		}
		
		allResults.sort((a, b) => a.distance - b.distance)
		
		// Deduplicate by file path (keep the best chunk for each file)
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
			console.log('\x1b[33mNo relevant information found.\x1b[0m')
			return
		}

		for (let i = 0; i < topResults.length; i++) {
			const r = topResults[i]
			console.log(`\x1b[35m[${i + 1}] Project: \x1b[1m${r.project}\x1b[0m\x1b[35m | File: \x1b[33m${r.file}\x1b[0m\x1b[35m | Distance: \x1b[32m${r.distance.toFixed(4)}\x1b[0m`)
			console.log(`\x1b[90m${'-'.repeat(80)}\x1b[0m`)
			console.log(r.content.trim())
			console.log(`\x1b[90m${'-'.repeat(80)}\x1b[0m\n`)
		}

	} catch (/** @type {any} */ err) {
		console.error(`\x1b[31m✘ Error: ${err.message}\x1b[0m`)
		process.exit(1)
	}
}

main()
