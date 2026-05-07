import { ModelAsApp } from '@nan0web/ui-cli'
import { Model } from '@nan0web/types'
import { matchProject, loadNameToDir } from './projectFilter.js'

/**
 * ShowIndexIntent — Intent to display metadata about indexed workspace packages.
 */
export class ShowIndexIntent extends ModelAsApp {
	static alias = 'show'
	static UI = {
		title: 'Show Index Metadata',
		icon: '📊',
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
	 * @param {Partial<ShowIndexIntent> | Record<string, any>} [data] Initial state
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
		const fs = await import('node:fs/promises')

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

		const filter = this.project === 'index' || this.project === 'all' ? null : this.project
		const nameToDir = filter?.startsWith('@') ? await loadNameToDir(db) : undefined

		const files = await db.listDir(dsFolder).catch(() => [])
		const metaFiles = files.filter((f) => f.name.endsWith('.bin.meta.json'))

		const results = []

		for (const f of metaFiles) {
			try {
				const relPath = path.join(dsFolder, f.name)
				const meta = await db.loadDocument(relPath)

				const nameMatch = f.name.match(/^([^-]+)-(.+)-index\.bin\.meta\.json$/)
				if (!nameMatch) continue

				const scope = nameMatch[1]
				const projectId = nameMatch[2].replace(/__/g, '/')

				if (!matchProject(projectId, filter || undefined, nameToDir)) continue
				if (this.scope && scope !== this.scope) continue

				results.push({
					scope,
					project: projectId,
					dim: meta.dim,
					space: meta.space,
					entries: meta.entries?.length || 0,
					nextId: meta.nextId,
					updatedAt: /** @type {any} */ (f).mtime || 'unknown',
				})
			} catch (e) {
				// Skip corrupted meta files
			}
		}

		if (results.length === 0) {
			yield show('No index metadata found.', 'error')
			return
		}

		if (this.json) {
			yield result(results, true)
		} else {
			let md = `────────────────────────────────────────\n📊 Workspace Index Metadata:\n────────────────────────────────────────\n\n`
			md += `| Scope | Project | Entries | Dim | Space | Last Updated |\n`
			md += `|-------|---------|---------|-----|-------|--------------|\n`

			for (const r of results.sort((a, b) => a.project.localeCompare(b.project))) {
				md += `| ${r.scope} | ${r.project} | ${r.entries} | ${r.dim} | ${r.space} | ${r.updatedAt} |\n`
			}

			md += `\n────────────────────────────────────────\n`
			yield show(md, 'info', /** @type {any} */ ({ format: 'markdown', raw: true }))
		}
	}
}
