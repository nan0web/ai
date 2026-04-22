// @ts-nocheck
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { Model } from '@nan0web/types'

/**
 * MarkdownIndexer — індексатор робочого простору.
 * Тепер працює виключно через this._.db з рекурсивним обходом.
 */
export class MarkdownIndexer extends Model {
	static maxChars = { default: 3000 }
	static overlap = { default: 200 }
	static targetProject = { default: null }
	static DEFAULT_SCOPE = 'docs'

	/**
	 * @param {object} [data]
	 * @param {string} [data.scope='docs'] Indexing scope ('docs' or 'source')
	 * @param {string} [data.targetProject] Optional project filter
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options]
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {number} */ this.maxChars
		/** @type {number} */ this.overlap
		/** @type {'docs'|'source'} */ this.scope = data.scope || MarkdownIndexer.DEFAULT_SCOPE
		/** @type {string|null} */ this.targetProject = data.targetProject || null
	}

	/**
	 * @param {string} content
	 * @returns {string}
	 */
	static hashContent(content) {
		return crypto.createHash('md5').update(content).digest('hex')
	}

	/**
	 * Рекурсивний обхід директорій через listDir
	 * @param {string} uri
	 * @returns {Promise<string[]>}
	 */
	async scanRecursive(dir) {
		const results = []
		if (!fs.existsSync(dir)) return results

		const entries = fs.readdirSync(dir)

		for (const name of entries) {
			const fullPath = path.join(dir, name)
			try {
				const stat = fs.statSync(fullPath)
				if (stat.isDirectory()) {
					if (name.startsWith('.') || name === 'node_modules' || name === 'dist') continue
					const nested = await this.scanRecursive(fullPath)
					results.push(...nested)
				} else {
					const isDocs = /\.(md|txt)$/.test(name)
					const isSource = /\.(js|ts|jsx|tsx)$/.test(name)
					
					if (this.scope === 'docs' && isDocs) results.push(fullPath)
					if (this.scope === 'source' && isSource) results.push(fullPath)
				}
			} catch (err) {
				console.warn(`  ! Warning: could not stat ${fullPath}, skipping.`)
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

		for (const section of sections) {
			if (!section.trim()) continue
			if (section.length <= this.maxChars) {
				pushChunk(section.trim())
				continue
			}

			const paragraphs = section.split(/\n\n/)
			let currentChunk = ''

			for (const p of paragraphs) {
				if (currentChunk.length + p.length > this.maxChars && currentChunk.length > 0) {
					pushChunk(currentChunk.trim())
					const overlapStr = currentChunk.length > this.overlap ? currentChunk.slice(-this.overlap) : currentChunk
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

	getDatasetDir() {
		const root = path.resolve(this._.workspaceRoot || process.cwd())
		const workspaceId = crypto.createHash('md5').update(root).digest('hex').slice(0, 8)
		return `~/datasets/${workspaceId}`
	}

	/**
	 * Scans the workspace and indexes target markdown files.
	 * @param {import('./Embedder.js').Embedder} embedder
	 */
	async *indexAll(embedder, opts = { force: false }) {
		const { DBFS } = await import('@nan0web/db-fs')
		const workspaceDb = new DBFS({ root: this._.workspaceRoot || process.cwd() })
		const db = this._.db // Global DB with Home mount
		const dsFolder = this.getDatasetDir()

		const { VectorDB } = await import('./VectorDB.js')
		const { IndexCacheModel } = await import('./IndexCacheModel.js')

		const VECTOR_CACHE_PATH = `${dsFolder}/vectors.csv`

		/** @type {Map<string, Float32Array>} */
		const vectorCache = new Map()

		// Load global vector cache
		try {
			const raw = await db.loadDocument(VECTOR_CACHE_PATH).catch(() => null)
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

		// Get projects from store registry
		const projects = []
		let storeRaw = await workspaceDb.loadDocumentAs('.csv', '/nan0web_store.csv').catch(() => null)

		
		if (Array.isArray(storeRaw)) {
			for (const row of storeRaw) {
				const name = row.name
				let dir = row.path
				// Ensure dir is relative to workspace root for DB compatibility
				if (dir && dir.startsWith(this._.workspaceRoot || '')) {
					dir = dir.slice((this._.workspaceRoot || '').length).replace(/^[\\/]+/, '')
				}
				if (this.targetProject && !name.toLowerCase().includes(this.targetProject.toLowerCase())) continue
				projects.push({ name, dir })
			}
		} else if (typeof storeRaw === 'string') {
			const lines = storeRaw.split('\n').filter(l => l.trim()).slice(1)
			for (const line of lines) {
				const parts = line.split(',')
				const name = parts[0]
				let dir = parts[2]
				if (dir && dir.startsWith(this._.workspaceRoot || '')) {
					dir = dir.slice((this._.workspaceRoot || '').length).replace(/^[\\/]+/, '')
				}
				if (this.targetProject && !name.toLowerCase().includes(this.targetProject.toLowerCase())) continue
				projects.push({ name, dir })
			}
		}

		if (projects.length === 0) {
			console.error('❌ No projects found in nan0web_store.csv. Check if file exists and is populated.')
			return
		}

		// Scanning projects for files recursively
		for (const proj of projects) {
			const absDir = path.join(this._.workspaceRoot || '', proj.dir)
			proj.files = await this.scanRecursive(absDir)
			console.log(`  - ${proj.name}: found ${proj.files.length} files`)
		}

		const totalFiles = projects.reduce((acc, p) => acc + (p.files?.length || 0), 0)
		console.log(`Total files to process: ${totalFiles}`)
		
		if (totalFiles === 0) {
			console.log('No files found for scope:', this.scope)
			return
		}

		yield { type: 'calc', total: totalFiles }

		const testEmb = await embedder.embed('test')
		const dim = testEmb.length
		let globalProcessed = 0

		for (const proj of projects) {
			const projId = proj.dir.replace(/\//g, '__')
			const indexPath = `${dsFolder}/${this.scope}-${projId}-index.bin`
			const cachePath = `${dsFolder}/${this.scope}-${projId}-index.cache.json`

			if (proj.files.length === 0) continue

			const fileToHashData = await db.loadDocument(cachePath).catch(() => ({}))
			const projectCache = new IndexCacheModel(fileToHashData)
			const newCacheState = new IndexCacheModel()
			const projFilesInfo = []
			let needsRebuild = false

			for (const absPath of proj.files) {
				const relPath = '/' + path.relative(this._.workspaceRoot || '', absPath)
				const content = await workspaceDb.loadDocumentAs('.txt', relPath).catch(() => '')
				if (!content) {
					globalProcessed++ // Skip but count
					continue
				}

				const chunks = this.chunkify(content, { file: relPath })
				const hashes = chunks.map((c) => c.hash)

				newCacheState.setHashes(absPath, hashes)
				projFilesInfo.push({ relPath, chunks })

				if (!projectCache.isUnchanged(absPath, hashes) || opts.force) {
					needsRebuild = true
				}
				
				globalProcessed++
				yield { 
					type: 'tick', 
					current: globalProcessed, 
					total: totalFiles, 
					phase: 'scanning',
					file: relPath,
					project: proj.name
				}
			}

			if (!needsRebuild && (await db.statDocument(indexPath)).exists && !opts.force) {
				yield {
					type: 'projectCached',
					name: proj.name,
					dir: proj.dir,
					files: proj.files.length,
					current: globalProcessed,
					total: totalFiles,
					phase: 'scanning'
				}
				continue
			}

			const vdb = new VectorDB({ dim }, { db })
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
					vdb.addVector(Array.from(fileVectors[i]), { file: relPath, content: chunks[i].content })
				}

				globalProcessed++
				yield { 
					type: 'tick', 
					current: globalProcessed, 
					total: totalFiles, 
					phase: 'embedding',
					file: relPath,
					project: proj.name
				}
			}

			yield { 
				type: 'projectIndexed', 
				name: proj.name, 
				dir: proj.dir, 
				files: proj.files.length,
				current: globalProcessed,
				total: totalFiles
			}
		}

		// Save global vector cache
		let csvToSave = ''
		for (const [hash, vec] of vectorCache.entries()) {
			const b64 = Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength).toString('base64')
			csvToSave += `${hash},${b64}\n`
		}
		await db.saveDocument(VECTOR_CACHE_PATH, csvToSave)
	}
}
