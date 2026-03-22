#!/usr/bin/env node

/**
 * search-workspace.js — CLI tool to query the HNSW vector indices manually.
 *
 * Usage:
 *   node bin/search-workspace.js "query text" [--project "App: willni"] [-k 5]
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
	let query = ''
	let targetProject = null
	let k = 5

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--project' || args[i] === '-p') {
			targetProject = args[++i]
		} else if (args[i] === '-k') {
			k = parseInt(args[++i], 10)
		} else if (!args[i].startsWith('-')) {
			query = args[i]
		}
	}

	if (!query) {
		console.error('\x1b[31mError: Missing query.\x1b[0m')
		console.error('Usage: node search-workspace.js "query text" [--project "App: willni"] [-k 5]')
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
		const vec = await embedder.embed('query: ' + query)
		let allResults = []
		
		for (const [name, vdb] of databases.entries()) {
			if (targetProject && name !== targetProject) continue
			const res = vdb.search(vec, k)
			for (const r of res) {
				allResults.push({ project: name, ...r })
			}
		}
		
		allResults.sort((a, b) => a.distance - b.distance)
		const topResults = allResults.slice(0, k)
		
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
