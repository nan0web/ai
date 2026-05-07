import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { matchProject, loadNameToDir } from './projectFilter.js'

import { Model } from '@nan0web/types'
import { show, result, progress } from '@nan0web/ui'

/** @typedef {'data' | 'docs' | 'source'} IndexerScope */

export class MarkdownIndexer extends Model {
	static maxChars = { default: 3000 }
	static overlap = { default: 200 }
	static scope = { default: 'docs' }
	static targetProject = { default: '' }
	static targetDir = { default: '' }
	static ignore = { default: [], type: 'string[]' }

	static UI = {
		scanning: 'Scanning projects',
	}

	/**
	 * @param {object} [data]
	 * @param {IndexerScope} [data.scope='docs'] Indexing scope ('docs' or 'source')
	 * @param {string} [data.targetProject] Optional project filter
	 * @param {string[]} [data.ignore] Directories to ignore
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options]
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {number} Maximum chars per chunk */ this.maxChars
		/** @type {number} Overlap length per chunk */ this.overlap
		/** @type {IndexerScope} Indexer scope */ this.scope
		/** @type {string} Target project */ this.targetProject
		/** @type {string} Target directory  */ this.targetDir
		/** @type {string[]} Paths to ignore */ this.ignore
	}

	/**
	 * @param {string} content
	 * @returns {string}
	 */
	static hashContent(content) {
		return crypto.createHash('md5').update(content).digest('hex')
	}

	/**
	 * Рекурсивний обхід директорій з фільтрацією за областю видимості (docs/source)
	 * @param {string} dir Поточна директорія
	 * @param {string} [baseDir] Базова директорія проекту для розрахунку відносних шляхів
	 * @returns {Promise<string[]>}
	 */
	async scanRecursive(dir, baseDir = dir) {
		const results = []
		const db = /** @type {any} */ (this._).workspaceDb || /** @type {any} */ (this._).db

		const defaultIgnore = [
			'node_modules',
			'dist',
			'releases',
			'__snapshots__',
			'snapshots',
			'playwright-report',
			'test-results',
			'coverage',
			'.git',
			'.next',
			'.venv',
			'.datasets',
			'bin',
			'build',
			'out',
		]
		const userIgnore = Array.isArray(this.ignore) ? this.ignore : []

		if (db) {
			const entries = await db.listDir(dir).catch(() => [])
			for (const entry of entries) {
				const name = entry.name
				const fullPath = entry.path
				const relToProject = path.relative(baseDir, fullPath)

				if (entry.isDirectory) {
					if (name.startsWith('.') || defaultIgnore.includes(name) || userIgnore.includes(name))
						continue
					const nested = await this.scanRecursive(fullPath, baseDir)
					results.push(...nested)
				} else {
					const isDocs = /\.(md|txt)$/.test(name)
					const isSource = /\.(ts|tsx|js|jsx|py)$/.test(name)
					const isData = /\.(yaml|yml|json|nan0|md|txt|csv)$/.test(name)

					const parts = relToProject.split(path.sep)
					const inDocsFolder = parts.includes('docs')
					const inTypesFolder = parts.includes('src') || parts.includes('types')
					const inDataFolder = parts.includes('data')

					if (this.scope === 'docs' && (isDocs || isData) && inDocsFolder) {
						results.push(fullPath)
					} else if (this.scope === 'source' && isSource && inTypesFolder) {
						results.push(fullPath)
					} else if (this.scope === 'data' && isData && inDataFolder) {
						results.push(fullPath)
					}
				}
			}
			return results
		}

		// Fallback to node:fs
		if (!fs.existsSync(dir)) return results
		const entries = fs.readdirSync(dir)

		for (const name of entries) {
			const fullPath = path.join(dir, name)
			const relToProject = path.relative(baseDir, fullPath)

			try {
				const stat = fs.statSync(fullPath)
				if (stat.isDirectory()) {
					if (name.startsWith('.') || defaultIgnore.includes(name) || userIgnore.includes(name))
						continue

					const nested = await this.scanRecursive(fullPath, baseDir)
					results.push(...nested)
				} else {
					const isDocs = /\.(md|txt)$/.test(name)
					const isSource = /\.(ts|tsx|js|jsx|py)$/.test(name)
					const isData = /\.(yaml|yml|json|nan0|md|txt|csv)$/.test(name)

					const parts = relToProject.split(path.sep)
					const inDocsFolder = parts.includes('docs')
					const inTypesFolder = parts.includes('src') || parts.includes('types')
					const inDataFolder = parts.includes('data')

					if (this.scope === 'docs' && (isDocs || isData) && inDocsFolder) {
						results.push(fullPath)
					} else if (this.scope === 'source' && isSource && inTypesFolder) {
						results.push(fullPath)
					} else if (this.scope === 'data' && isData && inDataFolder) {
						results.push(fullPath)
					}
				}
			} catch (e) {
				// Silent skip for access issues
			}
		}
		return results
	}

	/**
	 * @param {string} content
	 * @param {Object} metadata
	 * @returns {Array<{content: string, hash: string} & Object>}
	 */
	chunkify(content, metadata = {}) {
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

		let pendingSection = ''
		for (let i = 0; i < sections.length; i++) {
			let section = sections[i]
			if (!section.trim()) continue

			if (pendingSection) {
				section = pendingSection + (pendingSection.endsWith('\n') ? '' : '\n') + section
				pendingSection = ''
			}

			if (section.trim().length < 150 && i < sections.length - 1) {
				pendingSection = section
				continue
			}

			if (section.length <= this.maxChars) {
				pushChunk(section.trim())
				continue
			}

			const paragraphs = section.split(/\n\n/)
			let currentChunk = ''

			for (const p of paragraphs) {
				if (currentChunk.length + p.length > this.maxChars && currentChunk.length > 0) {
					pushChunk(currentChunk.trim())
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

	getWorkspaceRoot() {
		let root = path.resolve(/** @type {any} */ (this._).workspaceRoot || process.cwd())
		while (root && root !== '/') {
			if (fs.existsSync(path.join(root, 'pnpm-workspace.yaml'))) return root
			const parent = path.dirname(root)
			if (parent === root) break
			root = parent
		}
		return path.resolve(/** @type {any} */ (this._).workspaceRoot || process.cwd())
	}

	getDatasetDir() {
		return '.datasets'
	}

	/**
	 * Scans the workspace and indexes target markdown files.
	 * @param {import('./Embedder.js').Embedder} embedder
	 */
	async *indexAll(embedder, opts = { force: false }) {
		const { DBFS } = await import('@nan0web/db-fs')
		const root = this.getWorkspaceRoot()
		const workspaceDb = /** @type {any} */ (this._).workspaceDb || new DBFS({ root })
		const dsFolder = this.getDatasetDir()

		const { VectorDB } = await import('./VectorDB.js')
		const { IndexCacheModel } = await import('./IndexCacheModel.js')

		const VECTOR_CACHE_PATH = `${dsFolder}/vectors.csv`

		/** @type {Map<string, Float32Array>} */
		const vectorCache = new Map()

		// Load global vector cache
		try {
			const raw = await workspaceDb.loadDocument(VECTOR_CACHE_PATH).catch(() => null)
			if (raw && typeof raw === 'string') {
				const lines = raw.split('\n')
				for (const line of lines) {
					if (!line.trim()) continue
					const [hash, b64] = line.split(',')
					if (hash && b64) {
						const buf = Buffer.from(b64, 'base64')
						vectorCache.set(hash, new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4))
					}
				}
			}
		} catch (e) {}

		// Index the provided targetDir relative to the global workspace root
		const projects = [
			{
				name: this.targetProject || 'Current',
				dir: this.targetDir || '.',
			},
		]

		const t = this._.t
		yield progress(t(MarkdownIndexer.UI.scanning), 0, projects.length)

		// Scanning projects for files recursively
		let scanned = 0
		for (const proj of projects) {
			const absDir = path.join(root, proj.dir)
			proj.files = await this.scanRecursive(absDir, absDir)
			scanned++
			yield progress(proj.name, scanned, projects.length)
		}

		const totalFiles = projects.reduce((acc, p) => acc + (p.files?.length || 0), 0)

		if (totalFiles === 0) {
			yield {
				type: 'error',
				message: `No files found for scope: ${this.scope}`,
				project: this.targetProject,
				dir: this.targetDir,
			}
			return
		}

		yield { type: 'cacheCheckStart', total: totalFiles }

		const uncachedProjects = []
		let totalFilesToEmbed = 0

		const testEmb = await embedder.embed('test')
		const dim = testEmb.length

		let checkedFiles = 0
		for (const proj of projects) {
			const projId = proj.dir.replace(/\//g, '__')
			const indexPath = `${dsFolder}/${this.scope}-${projId}-index.bin`
			const cachePath = `${dsFolder}/${this.scope}-${projId}-index.cache.json`

			if (proj.files.length === 0) continue

			let rawCache = await workspaceDb.loadDocument(cachePath).catch(() => '{}')
			if (typeof rawCache !== 'string') rawCache = JSON.stringify(rawCache)
			let parsed = {}
			try {
				parsed = JSON.parse(rawCache)
			} catch (e) {}
			if (!parsed.entries) parsed = { entries: parsed }
			const projectCache = new IndexCacheModel(parsed)
			const newCacheState = new IndexCacheModel()
			const projFilesInfo = []
			let needsRebuild = false

			for (const absPath of proj.files) {
				const relPath = workspaceDb.relative(absPath)
				const content = await workspaceDb.loadDocumentAs('.txt', relPath).catch(() => '')

				if (content) {
					const chunks = this.chunkify(content, { file: relPath })
					const hashes = chunks.map((c) => c.hash)

					newCacheState.setHashes(absPath, hashes)
					projFilesInfo.push({ relPath, chunks })

					if (!projectCache.isUnchanged(absPath, hashes) || opts.force) {
						needsRebuild = true
					}
				}

				checkedFiles++
				yield {
					type: 'cacheCheckProgress',
					current: checkedFiles,
					total: totalFiles,
					project: proj.name,
				}
			}

			if (!needsRebuild && (await workspaceDb.statDocument(indexPath)).exists && !opts.force) {
				yield {
					type: 'projectCached',
					name: proj.name,
					dir: proj.dir,
					files: proj.files.length,
				}
			} else {
				totalFilesToEmbed += proj.files.length
				uncachedProjects.push({ proj, projId, indexPath, cachePath, newCacheState, projFilesInfo })
			}
		}

		if (totalFilesToEmbed === 0) {
			return // All projects were cached
		}

		yield {
			type: 'calc',
			total: totalFilesToEmbed,
			projects: uncachedProjects.map((p) => p.proj.name),
		}

		const queue = []
		let activeWorkers = uncachedProjects.length
		let notify = null

		const pushEvent = (ev) => {
			queue.push(ev)
			if (notify) {
				notify()
				notify = null
			}
		}

		// Process uncached projects in parallel
		for (const un of uncachedProjects) {
			;(async () => {
				const { proj, indexPath, cachePath, newCacheState, projFilesInfo } = un
				try {
					const vdb = new VectorDB({ dim }, { db: workspaceDb })
					let projectProcessed = 0

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

						for (let i = 0; i < chunks.length; i++) {
							vdb.addVector(Array.from(fileVectors[i]), {
								file: relPath,
								content: chunks[i].content,
							})
						}

						projectProcessed++
						pushEvent({
							type: 'tick',
							current: projectProcessed,
							total: projFilesInfo.length,
							phase: 'embedding',
							file: relPath,
							project: proj.name,
						})
					}

					await vdb.save(indexPath)
					await workspaceDb.saveDocument(cachePath, JSON.stringify(newCacheState.entries, null, 2))

					pushEvent({
						type: 'projectIndexed',
						name: proj.name,
						dir: proj.dir,
						files: proj.files.length,
					})
				} catch (err) {
					console.error(`Error indexing ${proj.name}:`, err)
				} finally {
					activeWorkers--
					if (notify) {
						notify()
						notify = null
					}
				}
			})()
		}

		while (activeWorkers > 0 || queue.length > 0) {
			if (queue.length > 0) {
				yield queue.shift()
			} else {
				await new Promise((r) => {
					notify = r
				})
			}
		}

		// Save global vector cache
		let csvToSave = ''
		for (const [hash, vec] of vectorCache.entries()) {
			const b64 = Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength).toString('base64')
			csvToSave += `${hash},${b64}\n`
		}
		await workspaceDb.saveDocument(VECTOR_CACHE_PATH, csvToSave)
	}
	/**
	 * Searches across all indexed projects in the workspace.
	 * @param {string} query
	 * @param {Object} opts
	 * @param {number} [opts.limit=10]
	 * @param {boolean} [opts.strict=false]
	 * @param {number} [opts.maxDistance=0.18]
	 * @param {string} [opts.project]
	 */
	async search(query, opts = {}) {
		const { DBFS } = await import('@nan0web/db-fs')
		const root = this.getWorkspaceRoot()
		const workspaceDb = /** @type {any} */ (this._).workspaceDb || new DBFS({ root })
		const dsFolder = this.getDatasetDir()
		const { VectorDB } = await import('./VectorDB.js')
		const { Embedder } = await import('./Embedder.js')
		const { matchProject, loadNameToDir } = await import('./projectFilter.js')

		const files = await workspaceDb.listDir(dsFolder).catch(() => [])
		const indexFiles = files.filter(
			(f) => f.name.startsWith(this.scope + '-') && f.name.endsWith('-index.bin'),
		)

		let allResults = []

		const embedderUrl =
			/** @type {any} */ (this._).embedderUrl ||
			process.env.EMBEDDER_URL ||
			'http://localhost:1234/v1'
		const embedder = new Embedder({ baseURL: embedderUrl })

		const isVector =
			Array.isArray(query) ||
			(query &&
				typeof query !== 'string' &&
				/** @type {any} */ (query).buffer instanceof ArrayBuffer)
		const queryVector =
			opts.strict || isVector ? query : await embedder.embed(/** @type {string} */ (query))

		const nameToDir = opts.project?.startsWith('@')
			? await loadNameToDir(/** @type {any} */ (this._).db || workspaceDb)
			: undefined

		for (const f of indexFiles) {
			const nameMatch = f.name.match(/^([^-]+)-(.+)-index\.bin$/)
			if (!nameMatch) continue
			const projectId = nameMatch[2].replace(/__/g, '/')

			if (!matchProject(projectId, opts.project || undefined, nameToDir)) continue

			const vdb = new VectorDB({}, { db: workspaceDb })
			const loaded = await vdb.load(f.path, { metaOnly: opts.strict }).catch((e) => {
				console.error(`MarkdownIndexer: Failed to load index ${f.path}:`, e.message)
				return false
			})
			if (!loaded) continue

			let results = []
			if (opts.strict) {
				results = Array.from(vdb._metadata.values()).map((meta) => ({ ...meta, distance: 0 }))
			} else {
				results = vdb.search(/** @type {number[]} */ (queryVector), opts.limit || 10)
			}

			if (!opts.strict && opts.maxDistance !== undefined) {
				results = results.filter((r) => r.distance <= (opts.maxDistance || 0))
			}
			if (opts.strict) {
				results = results.filter(
					(r) =>
						r.content &&
						r.content.toLowerCase().includes(/** @type {string} */ (query).toLowerCase()),
				)
			}

			results = results.map((r) => ({ ...r, score: r.distance }))
			allResults = allResults.concat(results)
		}

		// Sort by score (ascending for distance)
		return allResults.sort((a, b) => a.score - b.score).slice(0, opts.limit || 10)
	}
}
