import crypto from 'node:crypto'
import path from 'node:path'
import { Model } from '@nan0web/types'
import { ModelAsApp } from '@nan0web/ui-cli'
import { progress, show, result } from '@nan0web/ui'
import { MarkdownIndexer } from './MarkdownIndexer.js'
import { Embedder } from './Embedder.js'
import { IndexWorkspaceApp } from './IndexWorkspaceApp.js'
import { SearchSourcesIntent } from './SearchSourcesIntent.js'
import { GetSourceIntent } from './GetSourceIntent.js'

/**
 * AiAppModel — domain model for AI toolkit management (RAG, Indexing, MCP).
 * Follows Model-as-Schema v2 and OLMUI patterns.
 */
export class AiAppModel extends ModelAsApp {
	static UI = {
		indexingStarted: 'Starting workspace indexing...',
		projectIndexed: 'Project {project} indexed ({files} files) in {dir}',
		projectCached: 'Project {project} skipped (cache matched) in {dir}',
		scanningFiles: 'Scanning files...',
		embeddingChunks: 'Generating vectors...',
		searchQuery: 'Query: "{query}" (Provider: {url})',
		noResults: 'No results found for your query.',
		mcpSuccess: 'MCP Server successfully configured for {ide}!',
		emptyQuery: 'Query cannot be empty',
		error: 'Error: {message}',
	}

	static command = {
		help: 'Command to execute',
		options: [IndexWorkspaceApp, SearchSourcesIntent, GetSourceIntent],
		positional: true,
	}



	/**
	 * @param {Partial<AiAppModel> | Record<string, any>} [data] Initial state
	 * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {IndexWorkspaceApp|SearchSourcesIntent|null} */ this.command
	}

	async *run() {
		if (this.help) {
			yield show(this.generateHelp(), 'info', { hint: 'markdown' })
			return
		}

		if (this.command instanceof IndexWorkspaceApp) {
			yield* this.indexFull(this.command || {}, this.command.force)
		} else if (this.command instanceof SearchSourcesIntent) {
			if (this.command.help) {
				yield show(this.command.generateHelp(), 'info', { hint: 'markdown' })
				return
			}
			if (!this.command.query) {
				yield show(AiAppModel.UI.emptyQuery, 'error')
				return
			}
			yield* this.searchMethod(this.command.query, this.command)
		} else if (this.command instanceof GetSourceIntent) {
			yield* this.getMethod(this.command.path, this.command.version)
		} else {
			yield show(this.generateHelp(), 'info', { hint: 'markdown' })
		}
	}


	/**
	 * Rename original index to indexFull to avoid property name collision
	 */
	async *indexFull(opts = {}, force = false) {
		const t = (k, p = {}) => {
			const raw = this._.t ? this._.t(k, p) : k
			return raw.replace(/{(\w+)}/g, (_, x) => (p[x] !== undefined ? p[x] : `{${x}}`))
		}
		const db = this._.db

		const indexer = new MarkdownIndexer(
			{
				targetProject: opts.project || opts.targetProject,
				scope: opts.scope || 'docs',
			},
			{ db, workspaceRoot: this._.workspaceRoot },
		)

		yield progress(t(AiAppModel.UI.indexingStarted), 0)

		const embedderUrl = this._.embedderUrl || process.env.EMBEDDER_URL || 'http://localhost:1234/v1'
		const embedder = new Embedder({ baseURL: embedderUrl })

		for await (const it of indexer.indexAll(embedder, { force })) {
			if (it.type === 'calc') {
				yield progress(t(AiAppModel.UI.scanningFiles), 0, 'Index')
			}
			if (it.type === 'tick') {
				const statusMsg = it.phase === 'embedding' ? t(AiAppModel.UI.embeddingChunks) : t(AiAppModel.UI.scanningFiles)
				const percent = it.total > 0 ? (it.current / it.total) * 100 : 0
				
				// Only include file path for embedding where it's slow. For scanning just show total
				const label = it.phase === 'embedding' && it.file
					? `${statusMsg} (${it.current}/${it.total}) [${it.project}] ${it.file}`
					: `${statusMsg} (${it.current}/${it.total})`
				
				yield progress(label, percent, 'Index')
			}
			if (it.type === 'projectCached' || it.type === 'projectIndexed') {
				const type = it.type === 'projectCached' ? 'projectCached' : 'projectIndexed'
				const status = it.type === 'projectCached' ? 'info' : 'success'
				yield show(t(AiAppModel.UI[type], { project: it.name, dir: it.dir || '', files: it.files }), status)
			}
		}

		yield show(IndexWorkspaceApp.UI.done, 'success')
	}

	/**
	 * Rename original search to searchMethod
	 */
	async *searchMethod(query, opts = {}) {
		const t = (k, p = {}) => {
			const raw = this._.t ? this._.t(k, p) : k
			return raw.replace(/{(\w+)}/g, (_, x) => (p[x] !== undefined ? p[x] : `{${x}}`))
		}
		const embedderUrl = this._.embedderUrl || process.env.EMBEDDER_URL || 'http://localhost:1234/v1'

		yield show(t(AiAppModel.UI.searchQuery, { query, url: embedderUrl }))

		const embedder = new Embedder({ baseURL: embedderUrl })
		const instructPrefix =
			'Instruct: Retrieve relevant documentation, workflows, and architectural details to assist the software engineer.\nQuery: '
		const vec = /** @type {number[]} */ (await embedder.embed(instructPrefix + query))

		const results = await this.internalSearch(vec, { 
			k: opts.k || opts.limit || 10, 
			maxDistance: opts.maxDistance || 0.18, 
			targetProject: opts.project || opts.targetProject, 
			scope: opts.scope || 'docs' 
		})

		if (results.length === 0) {
			yield show(AiAppModel.UI.noResults, 'warn')
		}

		const { result } = await import('@nan0web/ui')
		yield result({ data: results })
	}

	/**
	 * Retrieve a specific file by path or package identifier.
	 * @param {string} filePath
	 * @param {string} [version='latest']
	 */
	async *getMethod(filePath, version = 'latest') {
		const t = (k, p = {}) => {
			const raw = this._.t ? this._.t(k, p) : k
			return raw.replace(/{(\w+)}/g, (_, x) => (p[x] !== undefined ? p[x] : `{${x}}`))
		}
		const db = this._.db

		yield show(t('Retrieving {path} (version: {version})...', { path: filePath, version }), 'info')

		// 1. Resolve Package ID (e.g. @nan0web/ui -> packages/ui)
		let resolvedPath = filePath
		if (filePath.startsWith('@')) {
			// Find in nan0web_store.csv
			const { DBFS } = await import('@nan0web/db-fs')
			const workspaceDb = new DBFS({ root: this._.workspaceRoot || process.cwd() })
			const storeRaw = await workspaceDb.loadDocumentAs('.csv', '/nan0web_store.csv').catch(() => null)
			
			const pkgName = filePath.split('/').slice(0, 2).join('/')
			const subPath = filePath.split('/').slice(2).join('/')
			
			let foundProj = null
			if (Array.isArray(storeRaw)) {
				foundProj = storeRaw.find(r => r.name === pkgName)
			}
			
			if (foundProj) {
				const projDir = foundProj.path.replace(this._.workspaceRoot || '', '').replace(/^[\\/]+/, '')
				resolvedPath = path.join(projDir, subPath)
			}
		}

		// 2. Fetch content
		try {
			const content = await db.fetch(resolvedPath)
			if (content) {
				const { result } = await import('@nan0web/ui')
				yield result({ 
					data: { 
						path: resolvedPath, 
						version, 
						content 
					},
					hint: 'markdown' // Show as code block if possible
				})
			} else {
				yield show(t('File {path} not found.', { path: resolvedPath }), 'error')
			}
		} catch (e) {
			yield show(t(AiAppModel.UI.error, { message: e.message }), 'error')
		}
	}

	/**
	 * Returns the global dataset directory path for the current workspace.
	 * @returns {string}
	 */
	getDatasetDir() {
		const root = path.resolve(this._.workspaceRoot || process.cwd())
		const workspaceId = crypto.createHash('md5').update(root).digest('hex').slice(0, 8)
		return `~/datasets/${workspaceId}`
	}

	/**
	 * @param {number[]} vec
	 * @param {{ k: number, maxDistance: number, targetProject: string | null, scope: string }} opts
	 * @returns {Promise<any[]>}
	 */
	async internalSearch(vec, { k, maxDistance, targetProject, scope = 'docs' }) {
		const db = this._.db
		const dsFolder = this.getDatasetDir()


		/** @type {Map<string, import('./VectorDB.js').VectorDB>} */
		const databases = new Map()
		const toLoad = []

		const addProject = (name, dir) => {
			const projId = dir.replace(/\//g, '__')
			const indexPath = `${dsFolder}/${scope}-${projId}-index.bin`
			toLoad.push({ name, indexPath })
		}

		try {
			const { DBFS } = await import('@nan0web/db-fs')
			const workspaceDb = new DBFS({ root: this._.workspaceRoot || process.cwd() })
			const csvRaw = await workspaceDb.loadDocumentAs('.csv', '/nan0web_store.csv').catch(() => null)
			this._.logger?.debug?.(`Register raw data type: ${typeof csvRaw}, isArray: ${Array.isArray(csvRaw)}`)

			if (Array.isArray(csvRaw)) {
				for (const row of csvRaw) {
					// Handle both object-array and array-of-arrays
					const name = row.name || row[0]
					const dir = row.path || row[2]
					if (name && dir) {
						addProject(name, dir)
					}
				}
			} else if (typeof csvRaw === 'string') {
				const lines = csvRaw.split('\n').filter(l => l.trim()).slice(1)
				for (const line of lines) {
					const parts = line.split(',')
					if (parts.length >= 3) {
						addProject(parts[0], parts[2])
					}
				}
			}
		} catch (e) {
			this._.logger?.error?.(`Register loading failed: ${e.message}`)
		}

		this._.logger?.debug?.(`Projects to load: ${toLoad.length}`)

		const { VectorDB } = await import('./VectorDB.js')

		for (const p of toLoad) {
			const vdb = new VectorDB({ dim: 1024 }, { db })
			const exists = await vdb.load(p.indexPath)
			this._.logger?.debug?.(`Loading index ${p.indexPath}: ${exists ? 'OK' : 'FAIL'}`)
			if (exists) {
				databases.set(p.name, vdb)
			}
		}

		let allResults = []
		const projectPatterns = targetProject
			? targetProject
					.split(',')
					.map((s) => s.trim().toLowerCase())
					.filter(Boolean)
					.filter(p => p !== 'null') // Fix for null filter
			: []

		for (const [name, vdb] of databases.entries()) {
			if (projectPatterns.length > 0) {
				const nameLower = name.toLowerCase()
				if (!projectPatterns.some((p) => nameLower.includes(p))) continue
			}
			const fetchCount = Math.max(k * 5, 50)
			const res = vdb.search(vec, fetchCount)
			for (const r of res) {
				if (r.distance <= 0.5) { // Debug search
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

		return topResults
	}
}

export default AiAppModel
