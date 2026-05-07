import { ModelAsApp } from '@nan0web/ui-cli'
import { matchProject, loadNameToDir } from './projectFilter.js'

/**
 * ListIndexIntent — Intent to list individual files within workspace indices.
 * Unlike ShowIndexIntent (which shows index metadata per project),
 * this lists the actual indexed file paths inside a specific index.
 */
export class ListIndexIntent extends ModelAsApp {
	static alias = 'ls'
	static UI = {
		title: 'List Indexed Files',
	}

	static project = {
		help: 'Filter by project name (substring)',
		type: 'string',
		alias: 'p',
		default: null,
		positional: true,
	}

	static scope = {
		help: 'Filter by index scope: "docs", "source", or "data".',
		type: 'string',
		alias: 's',
		options: ['docs', 'source', 'data'],
		default: null,
	}

	static json = {
		help: 'Output results in JSON format',
		type: 'boolean',
		default: false,
	}

	/**
	 * @param {Partial<ListIndexIntent> | Record<string, any>} [data] Initial state
	 * @param {any} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string|null} */ this.project
		/** @type {string|null} */ this.scope
		/** @type {boolean} */ this.json
	}

	/**
	 * @returns {AsyncGenerator<any, any, any>}
	 */
	async *run() {
		const { show, result, ask } = await import('@nan0web/ui')
		const { DBFS } = await import('@nan0web/db-fs')
		const path = await import('node:path')

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

		let workspaceRoot = path.resolve(/** @type {any} */ (this._).workspaceRoot || process.cwd())
		const db = /** @type {any} */ (this._).db || new DBFS({ root: workspaceRoot })
		const dsFolder = '.datasets'

		const nameToDir = this.project?.startsWith('@') ? await loadNameToDir(db) : undefined

		const files = await db.listDir(dsFolder).catch(() => [])
		const cacheFiles = files.filter((f) => f.name.endsWith('-index.cache.json'))

		/** @type {Array<{scope: string, project: string, file: string, chunks: number}>} */
		const results = []

		for (const f of cacheFiles) {
			try {
				const nameMatch = f.name.match(/^([^-]+)-(.+)-index\.cache\.json$/)
				if (!nameMatch) continue

				const scope = nameMatch[1]
				const projectId = nameMatch[2].replace(/__/g, '/')

				if (this.scope && scope !== this.scope) continue
				if (!matchProject(projectId, this.project || undefined, nameToDir)) continue

				const relPath = path.join(dsFolder, f.name)
				let rawCache = await db.loadDocument(relPath).catch(() => '{}')
				if (typeof rawCache !== 'string') rawCache = JSON.stringify(rawCache)

				let parsed = {}
				try {
					parsed = JSON.parse(rawCache)
				} catch (e) {}

				// Cache format: { entries: { "/path/to/file": ["hash1", ...] } }
				// or flat: { "/path/to/file": ["hash1", ...] }
				const entries = parsed.entries || parsed

				for (const [filePath, hashes] of Object.entries(entries)) {
					// Filter out cross-contaminated files from stale caches:
					// verify the file path contains the project directory
					const projectSegment = '/' + projectId + '/'
					if (!filePath.includes(projectSegment)) continue

					// Scope-specific folder validation (sync with MarkdownIndexer logic)
					const relToProject = filePath.split(projectSegment)[1] || ''
					const firstFolder = relToProject.split('/')[0]
					if (scope === 'source' && !['src', 'types'].includes(firstFolder)) continue
					if (scope === 'docs' && firstFolder !== 'docs') continue
					if (scope === 'data' && firstFolder !== 'data') continue

					results.push({
						scope,
						project: projectId,
						file: filePath,
						chunks: Array.isArray(hashes) ? hashes.length : 0,
					})
				}
			} catch (e) {
				// Skip corrupted cache files
			}
		}

		if (results.length === 0) {
			yield show('No indexed files found.', 'error')
			return
		}

		if (this.json) {
			yield result(results, true)
		} else {
			let md = `────────────────────────────────────────\nIndexed Files:\n────────────────────────────────────────\n\n`

			// Group by scope → project
			/** @type {Map<string, Map<string, Array<{file: string, chunks: number}>>>} */
			const grouped = new Map()
			for (const r of results) {
				const key = r.scope
				if (!grouped.has(key)) grouped.set(key, new Map())
				const projMap = grouped.get(key)
				if (projMap) {
					if (!projMap.has(r.project)) projMap.set(r.project, [])
					const list = projMap.get(r.project)
					if (list) list.push({ file: r.file, chunks: r.chunks })
				}
			}

			for (const [scope, projects] of [...grouped.entries()].sort()) {
				for (const [project, fileList] of [...projects.entries()].sort()) {
					md += `### Scope: ${scope} | Project: ${project} (${fileList.length} files)\n`
					for (const f of fileList.sort((a, b) => a.file.localeCompare(b.file))) {
						md += `  ${f.file} (${f.chunks} chunks)\n`
					}
					md += `\n`
				}
			}

			md += `────────────────────────────────────────\n`
			md += `Total: ${results.length} files\n`
			yield show(md, 'info', /** @type {any} */ ({ format: 'markdown', raw: true }))
		}
	}
}
