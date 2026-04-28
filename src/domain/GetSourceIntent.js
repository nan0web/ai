import { ModelAsApp } from '@nan0web/ui-cli'
import { DBFS } from '@nan0web/db-fs'
import path from 'node:path'
import os from 'node:os'

/**
 * GetSourceIntent — OLMUI Intent for retrieving specific files from the workspace or remote registry.
 */
export class GetSourceIntent extends ModelAsApp {
	static alias = 'get'
	static UI = {
		title: 'Retrieve Source',
		icon: '📄',
	}

	static path = {
		help: 'Package or file path (e.g. @nan0web/ui/src/index.js)',
		type: 'string',
		required: true,
		positional: true,
	}

	static version = {
		help: 'Version to retrieve (local/latest/version_tag)',
		type: 'string',
		alias: 'v',
		default: 'latest',
	}

	/**
	 * @param {Partial<GetSourceIntent> | Record<string, any>} [data] Initial state
	 * @param {any} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, /** @type {any} */ (options))
		/** @type {string} */ this.path
		/** @type {string} */ this.version = 'latest'
	}

	/**
	 * @returns {AsyncGenerator<any, any, any>}
	 */
	async *run() {
		const { show, result, ask } = await import('@nan0web/ui')

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

		const { workspaceRoot, t = (k) => k } = /** @type {any} */ (this._)

		const filePath = this.path
		const version = this.version
		const db = new DBFS({ root: workspaceRoot || process.cwd() })

		let resolvedPath = filePath
		if (filePath.startsWith('@')) {
			// 1. Setup global store mount
			const storeDir = path.join(os.homedir(), '.nan0web/store')
			db.mount('store', new DBFS({ root: storeDir }))

			const stores = ['/store/nan0web_store.csv', '/store/nan0web_store.local.csv']
			let allRows = []
			for (const s of stores) {
				const rows = await db.loadDocumentAs('.csv', s).catch(() => null)
				if (Array.isArray(rows)) allRows = allRows.concat(rows)
			}

			const pkgName = filePath.split('/').slice(0, 2).join('/')
			const subPath = filePath.split('/').slice(2).join('/')
			const foundProj = allRows.find((r) => r.name === pkgName)

			if (foundProj) {
				// Normalize path (if it's absolute, make it relative to root for the database)
				let projPath = foundProj.path
				if (projPath.startsWith(workspaceRoot || '')) {
					projPath = projPath.slice((workspaceRoot || '').length).replace(/^[\\/]+/, '')
				}
				resolvedPath = path.join(projPath, subPath)
			} else {
				yield show(t('Package {pkg} not found in store.', { pkg: pkgName }), 'error')
				return
			}
		}

		const ext = path.extname(resolvedPath)
		const isText = ['.js', '.json', '.nan0', '.md', '.txt', '.yaml', '.yml'].includes(ext)

		if (!isText) {
			yield show(
				t('Retrieving {path} (version: {version})...', { path: filePath, version }),
				'info',
			)
		}

		try {
			let content
			if (isText) {
				content = await db.loadDocumentAs('.txt', resolvedPath)
			} else {
				content = await db.fetch(resolvedPath)
			}

			if (content !== undefined && content !== null) {
				yield result(content, isText) // isText used as raw flag for ui-cli
			} else {
				yield show(t('File {path} not found.', { path: resolvedPath }), 'error')
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e)
			yield show(t('Failed to load {path}: {err}', { path: resolvedPath, err: msg }), 'error')
		}
	}
}
