import path from 'node:path'
import os from 'node:os'
import { Model } from '@nan0web/types'
import { show, result, ask } from '@nan0web/ui'
import { ModelAsApp } from '@nan0web/ui-cli'
import { DBFS } from '@nan0web/db-fs'

/**
 * StoreList — lists projects in the store
 */
class StoreList extends ModelAsApp {
	static alias = 'list'
	static UI = {
		title: 'List Projects',
		help: 'List all registered projects in the global store',
	}

	static json = { help: 'Output in JSON format', type: 'boolean', default: false }
	static jsonl = {
		help: 'Output in JSONL (line-delimited JSON) format',
		type: 'boolean',
		default: false,
	}
	static csv = { help: 'Output in CSV format', type: 'boolean', default: false }
	static nan0 = { help: 'Output in NaN0 format', type: 'boolean', default: false }
	static md = { help: 'Output in Markdown format (default)', type: 'boolean', default: true }

	/**
	 * @param {Partial<StoreList> | Record<string, any>} [data]
	 * @param {any} [options]
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {boolean} */ this.json
		/** @type {boolean} */ this.jsonl
		/** @type {boolean} */ this.csv
		/** @type {boolean} */ this.nan0
		/** @type {boolean} */ this.md
	}

	/**
	 * @returns {AsyncGenerator<any, any, any>}
	 */
	async *run() {
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

		const workspaceRoot = /** @type {any} */ (this._).workspaceRoot || process.cwd()
		const db = this._.db || new DBFS({ root: workspaceRoot })
		const storeDir = path.join(os.homedir(), '.nan0web/store')

		db.mount('store', new DBFS({ root: storeDir }))
		const stores = ['store/nan0web_store.csv', 'store/nan0web_store.local.csv']

		let allRows = []
		for (const s of stores) {
			const rows = await db.loadDocumentAs('.csv', s, null).catch(() => null)
			if (Array.isArray(rows)) allRows = allRows.concat(rows)
		}

		if (allRows.length === 0) {
			if (!this.raw) yield show('Store is empty.', 'info')
			return
		}

		if (this.json) {
			const data = JSON.stringify(allRows, null, 2)
			if (this.raw) {
				yield result(data, true)
			} else {
				yield show(data, 'info', /** @type {any} */ ({ format: 'text' }))
			}
		} else if (this.jsonl) {
			const data = allRows.map((r) => JSON.stringify(r)).join('\n')
			if (this.raw) {
				yield result(data, true)
			} else {
				yield show(data, 'info', /** @type {any} */ ({ format: 'text' }))
			}
		} else if (this.csv) {
			const headers = Object.keys(allRows[0] || {})
			const csv = [
				headers.join(','),
				...allRows.map((r) =>
					headers.map((h) => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','),
				),
			].join('\n')
			if (this.raw) {
				yield result(csv, true)
			} else {
				yield show(csv, 'info', /** @type {any} */ ({ format: 'text' }))
			}
		} else if (this.nan0) {
			const { NaN0 } = await import('@nan0web/types')
			const data = NaN0.stringify(allRows)
			if (this.raw) {
				yield result(data, true)
			} else {
				yield show(data, 'info', /** @type {any} */ ({ format: 'text' }))
			}
		} else {
			let md = '# 📦 Project Store\n\n'
			for (const r of allRows) {
				md += `## ${r.name}\n`
				md += `- **Workspace:** ${r.workspace}\n`
				md += `- **Path:** \`${r.path}\`\n`
				if (r.description) md += `- **Description:** ${r.description}\n`
				md += '\n'
			}

			if (this.raw) {
				yield result(md, true)
			} else {
				yield show(md, 'info', /** @type {any} */ ({ format: 'markdown' }))
				yield result({})
			}
		}
	}
}

/**
 * StoreAdd — adds a project to the store
 */
class StoreAdd extends ModelAsApp {
	static alias = 'add'
	static UI = {
		title: 'Add Project',
		help: 'Register a new project in the global store',
	}

	static path = {
		help: 'Path to the project directory',
		type: 'string',
		positional: true,
		default: '.',
	}

	/**
	 * @param {Partial<StoreAdd> | Record<string, any>} [data]
	 * @param {any} [options]
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string} */ this.path
	}

	/**
	 * @returns {AsyncGenerator<any, any, any>}
	 */
	async *run() {
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

		const { t } = this._
		const workspaceRoot = /** @type {any} */ (this._).workspaceRoot || process.cwd()
		const targetDir = path.resolve(process.cwd(), this.path)
		const relPath = path.relative(workspaceRoot, targetDir)
		const db = this._.db || new DBFS({ root: workspaceRoot })

		let name = ''
		let pkgJson = null
		try {
			const pkgRaw = await db.loadDocumentAs('.json', path.join(relPath, 'package.json'), null)
			if (pkgRaw) {
				pkgJson = pkgRaw
				name = pkgRaw.name
			}
		} catch (e) {}

		if (!name) {
			try {
				const nanRaw = await db.loadDocumentAs('.txt', path.join(relPath, 'nan0web.nan0'), null)
				if (nanRaw) {
					const match = nanRaw.match(/id:\s*['"]?([^'"\n]+)/)
					if (match) name = match[1].trim()
				}
			} catch (e) {}
		}

		if (!name) {
			if (!this.raw)
				yield show(t('No package.json or nan0web.nan0 found in {dir}', { dir: relPath }), 'error')
			return
		}

		const storeDir = path.join(os.homedir(), '.nan0web/store')
		const fs = await import('node:fs/promises')
		await fs.mkdir(storeDir, { recursive: true })

		db.mount('store', new DBFS({ root: storeDir }))

		let store = await db
			.loadDocumentAs('.csv', 'store/nan0web_store.local.csv', null)
			.catch(() => [])
		if (!Array.isArray(store)) store = []

		if (store.find((r) => r.name === name)) {
			if (!this.raw) yield show(t('Project {name} is already in the store.', { name }), 'info')
			return
		}

		store.push({
			name,
			workspace: relPath.split('/')[0] || 'local',
			path: targetDir,
			tags: '',
			version: pkgJson?.version || '0.1.0',
			description: pkgJson?.description || '',
		})

		await db.saveDocument('store/nan0web_store.local.csv', store)
		if (!this.raw)
			yield show(t('Project {name} added to store at {dir}', { name, dir: relPath }), 'success')
		yield result(name, true)
	}
}

/**
 * StoreRemove — removes a project from the store
 */
class StoreRemove extends ModelAsApp {
	static alias = 'remove'
	static UI = {
		title: 'Remove Project',
		help: 'Remove a project from the global store',
	}

	static nameArg = {
		help: 'Package name to remove',
		type: 'string',
		positional: true,
		required: true,
	}

	/**
	 * @param {Partial<StoreRemove> | Record<string, any>} [data]
	 * @param {any} [options]
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string} */ this.nameArg
	}

	/**
	 * @returns {AsyncGenerator<any, any, any>}
	 */
	async *run() {
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

		const { t } = this._
		const workspaceRoot = /** @type {any} */ (this._).workspaceRoot || process.cwd()
		const db = this._.db || new DBFS({ root: workspaceRoot })
		const storeDir = path.join(os.homedir(), '.nan0web/store')
		db.mount('store', new DBFS({ root: storeDir }))

		let store = await db
			.loadDocumentAs('.csv', 'store/nan0web_store.local.csv', null)
			.catch(() => [])
		if (!Array.isArray(store)) store = []

		const initialLen = store.length
		store = store.filter((r) => r.name !== this.nameArg)

		if (store.length < initialLen) {
			await db.saveDocument('store/nan0web_store.local.csv', store)
			if (!this.raw)
				yield show(t('Project {name} removed from store.', { name: this.nameArg }), 'success')
			yield result(this.nameArg, true)
		} else {
			if (!this.raw)
				yield show(t('Project {name} not found in store.', { name: this.nameArg }), 'error')
		}
	}
}

/**
 * StoreApp — router for store sub-commands
 */
export class StoreApp extends ModelAsApp {
	static alias = 'store'
	static UI = {
		title: 'Project Store',
		help: 'Manage projects store (add, list, remove)',
	}

	static action = {
		help: 'Action to perform',
		options: [StoreList, StoreAdd, StoreRemove],
		positional: true,
		default: StoreList,
	}

	static json = { help: 'Output in JSON format', type: 'boolean', default: false }
	static jsonl = { help: 'Output in JSONL format', type: 'boolean', default: false }
	static csv = { help: 'Output in CSV format', type: 'boolean', default: false }
	static nan0 = { help: 'Output in NaN0 format', type: 'boolean', default: false }
	static md = { help: 'Output in Markdown format (default)', type: 'boolean', default: true }

	/**
	 * @param {Partial<StoreApp> | Record<string, any>} [data]
	 * @param {any} [options]
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {InstanceType<typeof StoreList> | InstanceType<typeof StoreAdd> | InstanceType<typeof StoreRemove>} */
		this.action
		/** @type {boolean} */ this.json
		/** @type {boolean} */ this.jsonl
		/** @type {boolean} */ this.csv
		/** @type {boolean} */ this.nan0
		/** @type {boolean} */ this.md
	}

	/**
	 * @returns {AsyncGenerator<any, any, any>}
	 */
	async *run() {
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

		if (this.action && typeof this.action.run === 'function') {
			const action = /** @type {any} */ (this.action)
			// Propagate common flags from router to subcommand
			if (this.json) action.json = true
			if (this.jsonl) action.jsonl = true
			if (this.csv) action.csv = true
			if (this.nan0) action.nan0 = true
			if (this.md && action.md === undefined) action.md = true
			if (this.raw) action.raw = true

			yield* action.run()
		} else {
			if (!this.raw) yield show('Invalid action', 'error')
		}
	}
}
