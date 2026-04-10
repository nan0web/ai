import crypto from 'node:crypto'

export class MarkdownIndexer {
	constructor(config = {}) {
		this.maxChars = config.maxChars || 3000
		this.overlap = config.overlap || 200
		/** @type {string|undefined} */
		this.workspaceRoot = config.workspaceRoot
		/** @type {string|undefined} */
		this.targetProject = config.targetProject
	}

	/**
	 * @param {string} content
	 * @returns {string}
	 */
	static hashContent(content) {
		return crypto.createHash('md5').update(content).digest('hex')
	}

	/**
	 * @param {string} content
	 * @param {Object} metadata
	 * @returns {Array<{content: string, hash: string} & Object>}
	 */
	chunkify(content, metadata = {}) {
		// Split primarily by headers H2 and H3 or @docs/JSDoc block starts in code
		const sections = content.split(/\n(?=(?:#{2,3} |\/\*\*| @docs))/)
		const chunks = []

		const pushChunk = (text) => {
			if (!text) return
			chunks.push({
				content: text,
				hash: MarkdownIndexer.hashContent(text),
				...metadata,
			})
		}

		for (const section of sections) {
			if (!section.trim()) continue

			// If section is reasonably sized, keep it
			if (section.length <= this.maxChars) {
				pushChunk(section.trim())
				continue
			}

			// If section is too big, split by double newline (paragraphs) for sub-chunking
			const paragraphs = section.split(/\n\n/)
			let currentChunk = ''

			for (const p of paragraphs) {
				if (currentChunk.length + p.length > this.maxChars && currentChunk.length > 0) {
					pushChunk(currentChunk.trim())
					// Simple overlap: take the last ~overlap characters from currentChunk
					const overlapStr =
						currentChunk.length > this.overlap ? currentChunk.slice(-this.overlap) : currentChunk
					currentChunk = '... ' + overlapStr + '\n\n' + p
				} else {
					currentChunk += (currentChunk ? '\n\n' : '') + p
				}
			}
			if (currentChunk.trim().length > 0) {
				pushChunk(currentChunk.trim())
			}
		}

		return chunks
	}

	/**
	 * Scans the workspace and indexes target markdown files.
	 * Yields progress objects for UI Adapters.
	 * @param {import('./Embedder.js').Embedder} embedder
	 */
	async *indexAll(embedder) {
		const fs = await import('node:fs/promises')
		const path = await import('node:path')
		const { VectorDB } = await import('./VectorDB.js')
		const { IndexCacheModel } = await import('./IndexCacheModel.js')

		const rootDir = this.workspaceRoot || process.cwd()
		const targetProject = this.targetProject

		const IGNORE_DIRS = ['node_modules', '.git', '.datasets', 'dist', 'coverage', '.next', 'chat']
		const GLOBAL_DS_DIR = path.join(rootDir, '.datasets')
		const VECTOR_CACHE_PATH = path.join(GLOBAL_DS_DIR, 'vectors.csv')
		const OLD_VECTOR_CACHE_PATH = path.join(GLOBAL_DS_DIR, 'vectors.json')

		// 1. Load global vector cache (hash,base64) - Persistent memory
		/** @type {Map<string, Float32Array>} */
		const vectorCache = new Map()

		// Migration: look for old JSON first
		try {
			if (
				await fs
					.stat(OLD_VECTOR_CACHE_PATH)
					.then(() => true)
					.catch(() => false)
			) {
				const oldRaw = await fs.readFile(OLD_VECTOR_CACHE_PATH, 'utf-8')
				const oldData = JSON.parse(oldRaw)
				for (const [hash, b64] of Object.entries(oldData)) {
					const buf = Buffer.from(b64, 'base64')
					vectorCache.set(hash, new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4))
				}
				await fs.unlink(OLD_VECTOR_CACHE_PATH) // Cleanup after migration
			}
		} catch (e) {}

		// Standard CSV Load
		try {
			const raw = await fs.readFile(VECTOR_CACHE_PATH, 'utf-8')
			const lines = raw.split(/\r?\n/)
			for (const line of lines) {
				if (!line.trim()) continue
				const [hash, b64] = line.split(',')
				if (hash && b64) {
					const buf = Buffer.from(b64, 'base64')
					vectorCache.set(hash, new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4))
				}
			}
		} catch (e) {}

		async function getProjects(rootDir) {
			const projects = [{ name: 'Platform Root', dir: rootDir, isRoot: true }]
			const appsDir = path.join(rootDir, 'apps')
			const pkgsDir = path.join(rootDir, 'packages')
			try {
				const apps = await fs.readdir(appsDir, { withFileTypes: true })
				for (const app of apps) {
					if (app.isDirectory() && !app.name.startsWith('.')) {
						projects.push({
							name: `App: ${app.name}`,
							dir: path.join(appsDir, app.name),
							isRoot: false,
						})
					}
				}
			} catch (e) {}
			try {
				const pkgs = await fs.readdir(pkgsDir, { withFileTypes: true })
				for (const pkg of pkgs) {
					if (pkg.isDirectory() && !pkg.name.startsWith('.')) {
						projects.push({
							name: `Package: ${pkg.name}`,
							dir: path.join(pkgsDir, pkg.name),
							isRoot: false,
						})
					}
				}
			} catch (e) {}
			return projects
		}

		async function findMarkdownFiles(dir, isRootProject) {
			const files = []
			async function scan(currentDir) {
				const entries = await fs.readdir(currentDir, { withFileTypes: true }).catch(() => [])
				for (const entry of entries) {
					if (entry.name.startsWith('.')) continue
					if (IGNORE_DIRS.includes(entry.name)) continue

					if (
						isRootProject &&
						currentDir === dir &&
						(entry.name === 'apps' || entry.name === 'packages')
					)
						continue

					const fullPath = path.join(currentDir, entry.name)
					if (entry.isDirectory()) {
						await scan(fullPath)
					} else if (entry.name.endsWith('.md')) {
						files.push(fullPath)
					} else if (
						entry.name.endsWith('.js') &&
						fullPath.includes(`${path.sep}src${path.sep}`) &&
						!entry.name.endsWith('.test.js')
					) {
						files.push(fullPath)
					}
				}
			}
			await scan(dir)
			return files
		}

		const allProjects = await getProjects(rootDir)
		const projects = targetProject
			? allProjects.filter((p) => p.name.toLowerCase().includes(targetProject.toLowerCase()))
			: allProjects

		if (projects.length === 0) return

		let totalFiles = 0
		let globalProcessed = 0

		for (const proj of projects) {
			proj.files = await findMarkdownFiles(proj.dir, proj.isRoot)
			totalFiles += proj.files.length
		}

		if (totalFiles === 0) return

		yield { type: 'calc', total: totalFiles }

		const testEmb = await embedder.embed('test')
		const dim = testEmb.length

		for (const proj of projects) {
			const dsFolder = path.join(proj.dir, '.datasets')
			const indexPath = path.join(dsFolder, 'workspace-index.bin')
			const cachePath = path.join(dsFolder, 'workspace-index.cache.json')

			if (proj.files.length === 0) {
				await fs.unlink(indexPath).catch(() => {})
				await fs.unlink(cachePath).catch(() => {})
				continue
			}

			let fileToHashData = {}
			try {
				const raw = await fs.readFile(cachePath, 'utf-8')
				fileToHashData = JSON.parse(raw)
			} catch (e) {}

			const projectCache = new IndexCacheModel(fileToHashData)
			const newCacheState = new IndexCacheModel()
			const projFilesInfo = []
			let needsRebuild = false

			for (const filePath of proj.files) {
				const relPath = path.relative(proj.dir, filePath)
				const content = await fs.readFile(filePath, 'utf-8').catch(() => '')
				if (!content) continue

				const chunks = this.chunkify(content, { file: relPath })
				const hashes = chunks.map((c) => c.hash)

				newCacheState.setHashes(relPath, hashes)
				projFilesInfo.push({ relPath, chunks })

				if (!projectCache.isUnchanged(relPath, hashes)) {
					needsRebuild = true
				}
			}

			// Check deleted files
			const oldKeys = Object.keys(projectCache.entries)
			for (const key of oldKeys) {
				if (newCacheState.getHashes(key).length === 0) needsRebuild = true
			}

			const indexExists = await fs
				.stat(indexPath)
				.then(() => true)
				.catch(() => false)

			if (!needsRebuild && indexExists) {
				globalProcessed += proj.files.length
				yield {
					type: 'projectCached',
					name: proj.name,
					files: proj.files.length,
					current: globalProcessed,
					total: totalFiles,
				}
				continue
			}

			// Build/Rebuild Vector DB
			const vdb = new VectorDB({ dim })
			for (const { relPath, chunks } of projFilesInfo) {
				const missingChunks = []
				const fileVectors = new Array(chunks.length)

				for (let i = 0; i < chunks.length; i++) {
					const cached = vectorCache.get(chunks[i].hash)
					if (cached) {
						fileVectors[i] = cached
					} else {
						missingChunks.push({ idx: i, text: chunks[i].content, hash: chunks[i].hash })
					}
				}

				if (missingChunks.length > 0) {
					const texts = missingChunks.map((c) => c.text)
					const vectors = await embedder.embedBatch(texts)
					for (let k = 0; k < vectors.length; k++) {
						const v = new Float32Array(vectors[k])
						const originalIdx = missingChunks[k].idx
						fileVectors[originalIdx] = v
						vectorCache.set(missingChunks[k].hash, v)
					}
				}

				// Add all to VDB
				for (let i = 0; i < chunks.length; i++) {
					vdb.addVector(Array.from(fileVectors[i]), { file: relPath, content: chunks[i].content })
				}

				globalProcessed++
				yield { type: 'tick', current: globalProcessed, total: totalFiles }
			}

			await fs.mkdir(dsFolder, { recursive: true }).catch(() => {})
			await vdb.save(indexPath)
			await fs.writeFile(cachePath, JSON.stringify(newCacheState.entries, null, 2))

			yield { type: 'projectIndexed', name: proj.name, files: proj.files.length }
		}

		// Save global vector cache as CSV
		await fs.mkdir(GLOBAL_DS_DIR, { recursive: true }).catch(() => {})
		let csvToSave = ''
		for (const [hash, vec] of vectorCache.entries()) {
			const b64 = Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength).toString('base64')
			csvToSave += `${hash},${b64}\n`
		}
		await fs.writeFile(VECTOR_CACHE_PATH, csvToSave)
	}
}
