import { ModelAsApp } from '@nan0web/ui-cli'
import path from 'node:path'
import os from 'node:os'
import { DBFS } from '@nan0web/db-fs'

/**
 * CLI Application Model for Workspace Indexing.
 */
export class IndexWorkspaceApp extends ModelAsApp {
	static alias = 'index'
	static UI = {
		done: 'All multi-level indices updated successfully!',
	}

	static project = {
		help: 'Re-index only specific projects matching regular expression or glob.',
		type: 'string',
		alias: 'p',
		default: null,
	}

	static scope = {
		help: 'Indexing scope: "docs", "source", or "data".',
		type: 'string',
		alias: 's',
		options: ['docs', 'source', 'data'],
	}

	static force = {
		help: 'Force re-indexing all files.',
		type: 'boolean',
		alias: 'f',
		default: false,
	}

	static agents = {
		help: 'Index agent configurations.',
		type: 'boolean',
		alias: 'a',
		default: false,
	}

	static concurrency = {
		help: 'Number of projects to index concurrently.',
		type: 'number',
		alias: 'c',
		default: 1,
	}

	static ignore = {
		help: 'List of directories to ignore.',
		type: 'string[]',
		alias: 'i',
		default: [],
	}

	static sources = {
		help: 'Shortcut for --scope source.',
		type: 'boolean',
		alias: 'srs',
		default: false,
	}

	static skipData = {
		help: 'Skip indexing data scope.',
		type: 'boolean',
		alias: 'skip-data',
		default: false,
	}

	static skipSources = {
		help: 'Skip indexing source scope.',
		type: 'boolean',
		alias: 'skip-sources',
		default: false,
	}

	static skipDocs = {
		help: 'Skip indexing docs scope.',
		type: 'boolean',
		alias: 'skip-docs',
		default: false,
	}

	/**
	 * @param {Partial<IndexWorkspaceApp> | Record<string, any>} [data] Initial state
	 * @param {any} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, /** @type {any} */ (options))
		/** @type {string|null} */ this.project

		const defaultScopes = ['docs', 'source', 'data']
		if (/** @type {any} */ (this).skipData) defaultScopes.splice(defaultScopes.indexOf('data'), 1)
		if (/** @type {any} */ (this).skipSources)
			defaultScopes.splice(defaultScopes.indexOf('source'), 1)
		if (/** @type {any} */ (this).skipDocs) defaultScopes.splice(defaultScopes.indexOf('docs'), 1)

		/** @type {string[]} */ this.scopes = /** @type {any} */ (this).sources
			? ['source']
			: /** @type {any} */ (this).scope
				? [/** @type {any} */ (this).scope]
				: defaultScopes
		/** @type {boolean} */ this.sources
		/** @type {boolean} */ this.force
		/** @type {boolean} */ this.agents
		/** @type {number} */ this.concurrency = Number(this.concurrency) || 1
		/** @type {boolean} */ this.silent = !!data.silent
		/** @type {string[]} */ this.ignore = Array.isArray(this.ignore) ? this.ignore : []
	}

	/**
	 * @returns {AsyncGenerator<any, any, any>}
	 */
	async *run() {
		const { ask, show } = await import('@nan0web/ui')
		if (this.help) {
			const content = this.generateHelp()
			if (this.raw) {
				yield show(content, 'info', /** @type {any} */ ({ format: 'markdown', raw: true }))
				return
			}
			const title = /** @type {any} */ (this.constructor).UI?.title || 'Help'
			yield ask('help', { content, title: `${title} Help`, hint: 'content-viewer' })
			return
		}
		if (this.agents) {
			yield* this.indexAgents()
			return
		}
		yield* this.indexFull()
	}

	async *indexFull() {
		const { show, progress } = await import('@nan0web/ui')
		const { MarkdownIndexer } = await import('./MarkdownIndexer.js')
		const { Embedder } = await import('./Embedder.js')

		const fs = await import('node:fs')
		let workspaceRoot = path.resolve(/** @type {any} */ (this._).workspaceRoot || process.cwd())
		let current = workspaceRoot
		while (current && current !== '/') {
			if (fs.existsSync(path.join(current, 'pnpm-workspace.yaml'))) {
				workspaceRoot = current
				break
			}
			const parent = path.dirname(current)
			if (parent === current) break
			current = parent
		}
		const db = this._.db || new DBFS({ root: workspaceRoot })

		// Use a dedicated DB instance for the store to avoid "sealed" errors on the main app DB
		const storeDb = this._.db || new DBFS({ root: workspaceRoot })
		const storeDir = path.join(os.homedir(), '.nan0web/store')
		storeDb.mount('store', new DBFS({ root: storeDir }))

		const projects = []
		const stores = ['store/nan0web_store.csv', 'store/nan0web_store.local.csv']

		for (const s of stores) {
			const rows = await storeDb.loadDocumentAs('.csv', s, null).catch(() => null)
			if (Array.isArray(rows)) {
				for (const row of rows) {
					if (!row.path) continue
					let dir = row.path
					if (dir.startsWith(workspaceRoot)) {
						dir = dir.slice(workspaceRoot.length).replace(/^[\\/]+/, '')
					}
					projects.push({ name: row.name, dir })
				}
			}
		}

		if (projects.length === 0) {
			if (!this.silent) yield show(`No projects found in global store at ${storeDir}.`, 'error')
			return
		}

		if (!this.silent)
			yield show(`Starting mass indexing for ${projects.length} projects...`, 'info')

		const embedderUrl =
			/** @type {any} */ (this._).embedderUrl ||
			process.env.EMBEDDER_URL ||
			'http://localhost:1234/v1'
		const embedder = new Embedder({ baseURL: embedderUrl })

		if (this.concurrency > 1) {
			const queue = []
			let pullResolve = null
			let done = false

			const push = (val) => {
				queue.push(val)
				if (pullResolve) {
					pullResolve()
					pullResolve = null
				}
			}

			const worker = async (proj) => {
				for (const scope of this.scopes) {
					const indexer = new MarkdownIndexer(
						/** @type {any} */ ({
							targetProject: proj.name,
							targetDir: proj.dir,
							scope: scope,
							ignore:
								!proj.dir || proj.dir === '.' ? [...this.ignore, 'apps', 'packages'] : this.ignore,
						}),
						/** @type {any} */ ({ db: storeDb, workspaceRoot }),
					)
					try {
						for await (const it of indexer.indexAll(embedder, { force: this.force })) {
							it.project = it.project || proj.name
							it.scope = scope
							push(it)
						}
					} catch (err) {
						const msg = err instanceof Error ? err.message : String(err)
						push({ type: 'error', message: `Error indexing ${proj.name} [${scope}]: ${msg}` })
					}
				}
			}

			const runAll = async () => {
				const executing = new Set()
				for (const proj of projects) {
					if (this.project && !proj.name.includes(this.project)) continue
					const p = worker(proj).finally(() => executing.delete(p))
					executing.add(p)
					if (executing.size >= this.concurrency) {
						await Promise.race(executing)
					}
				}
				await Promise.all(executing)
				done = true
				if (pullResolve) pullResolve()
			}

			runAll()

			while (!done || queue.length > 0) {
				if (queue.length === 0) {
					await new Promise((r) => (pullResolve = r))
				}
				const it = queue.shift()
				if (!it) continue

				if (it.type === 'error') {
					if (!this.silent) {
						const ctx = it.project ? `[${it.project}] ` : ''
						yield show(`${ctx}${it.message}`, 'error')
					}
					continue
				}
				if (it.type === 'scanProgress')
					yield progress(
						`Scanning [${it.project}] (${it.files} files)`,
						(it.current / it.total) * 100,
						/** @type {any} */ ({ id: `Index_Scan_${it.project}`, width: 30 }),
					)
				if (it.type === 'cacheCheckStart') {
					yield progress('', 100, { id: `Index_Scan_${it.project}`, stop: 'success' })
					yield progress('Verifying Cache...', 0, { id: `Index_Cache_${it.project}`, width: 30 })
				}
				if (it.type === 'cacheCheckProgress')
					yield progress(`Verifying Cache... [${it.project}]`, (it.current / it.total) * 100, {
						id: `Index_Cache_${it.project}`,
						width: 30,
					})
				if (it.type === 'calc') {
					yield progress('', 100, { id: `Index_Cache_${it.project}`, stop: 'success' })
					for (const p of it.projects)
						yield progress(
							'Generating vectors...',
							0,
							/** @type {any} */ ({
								id: `Index_${p}`,
								title: `[${p}]`,
								forceOneLine: true,
								width: 30,
							}),
						)
				}
				if (it.type === 'tick')
					yield progress(`${it.project} ${it.file}`, it.current, {
						id: `Index_${it.project}`,
						total: it.total,
						forceOneLine: true,
						width: 30,
					})
				if (!this.silent && it.type === 'projectCached')
					yield show(`Project ${it.name} skipped (cache matched) in ${it.dir}`, 'info')
				if (!this.silent && it.type === 'projectIndexed')
					yield show(`Project ${it.name} indexed (${it.files} files) in ${it.dir}`, 'success')
			}
		} else {
			for (const proj of projects) {
				if (this.project && !proj.name.includes(this.project)) continue

				for (const scope of this.scopes) {
					const indexer = new MarkdownIndexer(
						/** @type {any} */ ({
							targetProject: proj.name,
							targetDir: proj.dir,
							scope: scope,
							ignore:
								!proj.dir || proj.dir === '.' ? [...this.ignore, 'apps', 'packages'] : this.ignore,
						}),
						/** @type {any} */ ({ db: storeDb, workspaceRoot }),
					)

					for await (const it of indexer.indexAll(embedder, { force: this.force })) {
						if (it.type === 'error') {
							if (!this.silent) {
								const ctx = it.project ? `[${it.project}] ` : ''
								yield show(`${ctx}${it.message}`, 'error')
							}
							continue
						}
						it.project = it.project || proj.name
						if (it.type === 'scanProgress')
							yield progress(
								`Scanning [${it.project}] (${it.files} files)`,
								(it.current / it.total) * 100,
								{ id: `Index_Scan_${it.project}`, width: 30 },
							)
						if (it.type === 'cacheCheckStart') {
							yield progress('', 100, { id: `Index_Scan_${it.project}`, stop: 'success' })
							yield progress('Verifying Cache...', 0, {
								id: `Index_Cache_${it.project}`,
								width: 30,
							})
						}
						if (it.type === 'cacheCheckProgress')
							yield progress(`Verifying Cache... [${it.project}]`, (it.current / it.total) * 100, {
								id: `Index_Cache_${it.project}`,
								width: 30,
							})
						if (it.type === 'calc') {
							yield progress('', 100, { id: `Index_Cache_${it.project}`, stop: 'success' })
							for (const p of it.projects)
								yield progress(
									'Generating vectors...',
									0,
									/** @type {any} */ ({
										id: `Index_${p}`,
										title: `[${p}]`,
										forceOneLine: true,
										width: 30,
									}),
								)
						}
						if (it.type === 'tick')
							yield progress(`${it.project} ${it.file}`, it.current, {
								id: `Index_${it.project}`,
								total: it.total,
								forceOneLine: true,
								width: 30,
							})
						if (!this.silent && it.type === 'projectCached')
							yield show(`Project ${it.name} skipped (cache matched) in ${it.dir}`, 'info')
						if (!this.silent && it.type === 'projectIndexed')
							yield show(`Project ${it.name} indexed (${it.files} files) in ${it.dir}`, 'success')
					}
				}
			}
		}

		if (!this.silent) yield show(IndexWorkspaceApp.UI.done, 'success')
	}

	async *indexAgents() {
		const { show, progress } = await import('@nan0web/ui')

		if (!this.silent) yield show('Starting agents indexing (nan0web.nan0)...', 'info')

		const fs = await import('node:fs')
		let workspaceRoot = path.resolve(/** @type {any} */ (this._).workspaceRoot || process.cwd())
		let current = workspaceRoot
		while (current && current !== '/') {
			if (fs.existsSync(path.join(current, 'pnpm-workspace.yaml'))) {
				workspaceRoot = current
				break
			}
			const parent = path.dirname(current)
			if (parent === current) break
			current = parent
		}

		const db = this._.db

		// Use a dedicated DB instance for the store to avoid "sealed" errors
		const storeDb = new DBFS({ root: workspaceRoot })
		const storeDir = path.join(os.homedir(), '.nan0web/store')
		storeDb.mount('store', new DBFS({ root: storeDir }))

		const projects = []
		const stores = ['store/nan0web_store.csv', 'store/nan0web_store.local.csv']

		for (const s of stores) {
			const rows = await storeDb.loadDocumentAs('.csv', s).catch(() => null)
			if (Array.isArray(rows)) {
				for (const row of rows) {
					let dir = row.path
					if (!dir) continue
					if (dir.startsWith(workspaceRoot)) {
						dir = dir.slice(workspaceRoot.length).replace(/^[\\/]+/, '')
					}
					projects.push({ name: row.name, dir })
				}
			}
		}

		if (projects.length === 0) {
			if (!this.silent) yield show(`No projects found in global store at ${storeDir}.`, 'error')
			return
		}

		yield progress('Scanning packages for nan0web.nan0...', 0, { id: 'Agents_Index', width: 30 })

		const allAgents = []
		let scanned = 0

		for (const proj of projects) {
			const configPath = path.join(proj.dir, 'nan0web.nan0')
			const _db = /** @type {any} */ (db)
			const content = await _db.loadDocumentAs('.txt', '/' + configPath, null).catch(() => null)

			if (content) {
				const lines = content.split('\n')
				let currentAgent = null
				let inWorkflows = false
				let inInspectors = false

				for (const line of lines) {
					if (line.trim().startsWith('- id:')) {
						currentAgent = /** @type {any} */ ({
							id: line.split(':')[1].replace(/['"]/g, '').trim(),
							package: proj.name,
							workflows: [],
							inspectors: [],
						})
						allAgents.push(currentAgent)
						inWorkflows = false
						inInspectors = false
					} else if (currentAgent) {
						if (line.trim().startsWith('description:')) {
							currentAgent.description = line
								.substring(line.indexOf(':') + 1)
								.replace(/['"]/g, '')
								.trim()
						} else if (line.trim().startsWith('workflows:')) {
							inWorkflows = true
							inInspectors = false
						} else if (line.trim().startsWith('inspectors:')) {
							inInspectors = true
							inWorkflows = false
						} else if (line.trim().startsWith('-') && inWorkflows) {
							currentAgent.workflows.push(line.replace('-', '').replace(/['"]/g, '').trim())
						} else if (line.trim().startsWith('-') && inInspectors) {
							currentAgent.inspectors.push(line.replace('-', '').replace(/['"]/g, '').trim())
						}
					}
				}
			}
			scanned++
			yield progress(`[${proj.name}]`, (scanned / projects.length) * 100, {
				id: 'Agents_Index',
				width: 30,
			})
		}

		yield progress('', 100, { id: 'Agents_Index', stop: 'success' })

		const indexPath = '/nan0web_agents.index.nan0'
		const _db = /** @type {any} */ (db)
		await _db.saveDocument(indexPath, {
			generatedAt: new Date().toISOString(),
			total: allAgents.length,
			agents: allAgents,
		})

		yield show(
			`✅ Agents indexed: ${allAgents.length} agents in ${projects.length} packages.`,
			'success',
		)
	}
}
