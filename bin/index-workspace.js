#!/usr/bin/env node

/**
 * index-workspace.js — Builds multi-level HNSW vector indices for apps, packages, and root platform.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Embedder } from '../src/domain/Embedder.js'
import { VectorDB } from '../src/domain/VectorDB.js'
import { MarkdownIndexer } from '../src/domain/MarkdownIndexer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkgRoot = path.join(__dirname, '../')
const defaultWorkspaceRoot = path.join(pkgRoot, '../../')

let targetProject = null
let explicitWorkspaceRoot = null

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
	console.log(`
\x1b[36m@nan0web/ai Workspace Indexer\x1b[0m

Builds multi-level HNSW vector indices for apps, packages, and the root platform.

\x1b[33mUsage:\x1b[0m
  node bin/index-workspace.js [options]

\x1b[33mOptions:\x1b[0m
  -p, --project <name>   Re-index only specific projects matching this name
                         (e.g., "-p 0HCnAI" matches "Package: 0HCnAI.framework").
                         This skips all other projects.
  -h, --help             Show this help message.

By default, the script scans the entire monorepo starting from the package root.
`)
	process.exit(0)
}

for (let i = 0; i < args.length; i++) {
	if (args[i] === '--project' || args[i] === '-p') {
		targetProject = args[++i]
	} else if (!args[i].startsWith('-') && !explicitWorkspaceRoot) {
		explicitWorkspaceRoot = args[i]
	}
}

const workspaceRoot = path.resolve(explicitWorkspaceRoot || defaultWorkspaceRoot)

const EMBEDDER_URL = process.env.EMBEDDER_URL || 'http://localhost:1234/v1'
const IGNORE_DIRS = ['node_modules', '.git', '.datasets', 'dist', 'coverage', '.next', 'chat']

const embedder = new Embedder({ baseURL: EMBEDDER_URL })
// Lower maxChars to 1200 to avoid hitting the 512 token limit of E5 models (especially for Cyrillic chars)
const indexer = new MarkdownIndexer({ maxChars: 1200, overlap: 200 })

function drawProgressBar(current, total, label = '') {
	const cols = process.stdout.columns || 80
	const barLen = Math.max(10, cols - 40)
	const percent = total === 0 ? 1 : current / total
	const filled = Math.round(barLen * percent)
	const empty = barLen - filled
	const bar = '█'.repeat(filled) + '░'.repeat(empty)
	const pctStr = Math.round(percent * 100).toString().padStart(3, ' ')
	process.stdout.write(`\r\x1b[36m${label}\x1b[0m \x1b[32m[${bar}]\x1b[0m ${pctStr}% | ${current}/${total} files\x1b[K`)
}

async function getProjects(rootDir) {
	const projects = [ { name: 'Platform Root', dir: rootDir, isRoot: true } ]
	
	const appsDir = path.join(rootDir, 'apps')
	const pkgsDir = path.join(rootDir, 'packages')
	
	try {
		const apps = await fs.readdir(appsDir, { withFileTypes: true })
		for (const app of apps) {
			if (app.isDirectory() && !app.name.startsWith('.')) {
				projects.push({ name: `App: ${app.name}`, dir: path.join(appsDir, app.name), isRoot: false })
			}
		}
	} catch(e) {}

	try {
		const pkgs = await fs.readdir(pkgsDir, { withFileTypes: true })
		for (const pkg of pkgs) {
			if (pkg.isDirectory() && !pkg.name.startsWith('.')) {
				projects.push({ name: `Package: ${pkg.name}`, dir: path.join(pkgsDir, pkg.name), isRoot: false })
			}
		}
	} catch(e) {}
	
	return projects
}

async function findMarkdownFiles(dir, isRootProject) {
	const files = []
	async function scan(currentDir) {
		const entries = await fs.readdir(currentDir, { withFileTypes: true }).catch(() => [])
		for (const entry of entries) {
			if (entry.name.startsWith('.')) continue
			if (IGNORE_DIRS.includes(entry.name)) continue
			
			// If we are scanning the Root Platform, do not descend into apps/ or packages/
			if (isRootProject && currentDir === dir && (entry.name === 'apps' || entry.name === 'packages')) {
				continue
			}
			
			const fullPath = path.join(currentDir, entry.name)
			if (entry.isDirectory()) {
				await scan(fullPath)
			} else if (entry.name.endsWith('.md')) {
				files.push(fullPath)
			}
		}
	}
	await scan(dir)
	return files
}

async function main() {
	console.log(`\x1b[36m📦 Workspace: ${workspaceRoot}\x1b[0m`)
	console.log(`\x1b[36m🔗 Embedder:  ${EMBEDDER_URL}\x1b[0m\n`)

	try {
		const test = await embedder.embed('test')
		const dim = test.length
		console.log(`\x1b[32m✔ Embedder connected (Dimension: ${dim})\x1b[0m\n`)

		const allProjects = await getProjects(workspaceRoot)
		const projects = targetProject 
			? allProjects.filter(p => p.name.toLowerCase().includes(targetProject.toLowerCase()))
			: allProjects

		if (projects.length === 0) {
			console.log(`\x1b[33mNo projects found matching "${targetProject}".\x1b[0m`)
			return
		}
		
		console.log(`\x1b[36m🔍 Scanning directories...\x1b[0m`)
		let totalFiles = 0
		let totalBytes = 0

		for (const proj of projects) {
			proj.files = await findMarkdownFiles(proj.dir, proj.isRoot)
			for (const f of proj.files) {
				const stat = await fs.stat(f).catch(() => ({ size: 0 }))
				totalBytes += stat.size
			}
			totalFiles += proj.files.length
		}

		console.log(`\x1b[36m✔ Found ${totalFiles} markdown files across ${projects.length} projects (${(totalBytes/1024/1024).toFixed(2)} MB)\x1b[0m\n`)

		if (totalFiles === 0) {
			console.log(`\x1b[33mNo markdown files found.\x1b[0m`)
			return
		}

		let globalProcessed = 0
		drawProgressBar(globalProcessed, totalFiles, 'Global Progress')

		for (const proj of projects) {
			const dsFolder = path.join(proj.dir, '.datasets')
			const indexPath = path.join(dsFolder, 'workspace-index.bin')

			if (proj.files.length === 0) {
				await fs.unlink(indexPath).catch(() => {})
				// Also try removing the .datasets directory if it's empty
				await fs.rmdir(dsFolder).catch(() => {})
				continue
			}
			const vdb = new VectorDB({ dim })
			let totalChunks = 0

			for (let i = 0; i < proj.files.length; i++) {
				const filePath = proj.files[i]
				const relPath = path.relative(proj.dir, filePath)
				const content = await fs.readFile(filePath, 'utf-8').catch(() => '')
				if (!content) {
					globalProcessed++
					continue
				}
				
				const chunks = indexer.chunkify(content, { file: relPath })

				if (chunks.length > 0) {
					// E5-instruct models require no document-side prefixes.
					const texts = chunks.map(c => c.content)
					const vectors = await embedder.embedBatch(texts)
					for (let j = 0; j < chunks.length; j++) {
						vdb.addVector(vectors[j], { file: relPath, content: chunks[j].content })
						totalChunks++
					}
				}
				globalProcessed++
				drawProgressBar(globalProcessed, totalFiles, 'Global Progress')
			}

			await fs.mkdir(dsFolder, { recursive: true }).catch(()=>{})
			await vdb.save(indexPath)
			const stats = await fs.stat(indexPath).catch(() => ({ size: 0 }))
			
			process.stdout.write('\r\x1b[K')
			console.log(`\x1b[32m✔ ${proj.name} \x1b[90m(${proj.files.length} files -> ${totalChunks} chunks, ${(stats.size/1024).toFixed(1)} KB)\x1b[0m`)
			if (globalProcessed < totalFiles) {
				drawProgressBar(globalProcessed, totalFiles, 'Global Progress')
			}
		}
		
		console.log(`\n\x1b[32m🎉 All multi-level indices created successfully!\x1b[0m`)

	} catch (/** @type {any} */ err) {
		console.error(`\n\x1b[31m✘ Error: ${err.message}\x1b[0m`)
		process.exit(1)
	}
}

main()
