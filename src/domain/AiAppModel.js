import path from 'node:path'
import { ModelAsApp } from '@nan0web/ui-cli'
import { Model } from '@nan0web/types'
import { ask, show, result } from '@nan0web/ui'

import { IndexWorkspaceApp } from './IndexWorkspaceApp.js'
import { SyncWorkspaceApp } from './SyncWorkspaceApp.js'
import { StoreApp } from './StoreApp.js'
import { SearchSourcesIntent } from './SearchSourcesIntent.js'
import { GetSourceIntent } from './GetSourceIntent.js'
import { ShowIndexIntent } from './ShowIndexIntent.js'
import { ListIndexIntent } from './ListIndexIntent.js'

/**
 * AiAppModel — domain model for AI toolkit management (RAG, Indexing, MCP).
 */
export class AiAppModel extends ModelAsApp {
	static alias = 'nan0ai'
	static UI = {
		title: 'NaN0•Web AI Toolkit',
		emptyQuery: 'Search query cannot be empty.',
	}

	static command = {
		help: 'Command to execute',
		options: [
			IndexWorkspaceApp,
			SyncWorkspaceApp,
			StoreApp,
			SearchSourcesIntent,
			GetSourceIntent,
			ShowIndexIntent,
			ListIndexIntent,
		],
		positional: true,
	}

	/**
	 * @param {Partial<AiAppModel> | Record<string, any>} [data] Initial state
	 * @param {import('@nan0web/ui').ModelAsAppOptions & Record<string, any>} [options] Model options
	 */
	constructor(data = {}, options = /** @type {any} */ ({})) {
		super(data, /** @type {any} */ (options))
		/** @type {InstanceType<typeof IndexWorkspaceApp> | InstanceType<typeof SyncWorkspaceApp> | InstanceType<typeof StoreApp> | SearchSourcesIntent | GetSourceIntent} */
		this.command
	}

	/**
	 * Main execution entry point for AiAppModel.
	 * Acts as a router, delegating execution to the appropriate subcommand (Executor).
	 * @returns {AsyncGenerator<any, any, any>}
	 */
	async *run() {
		if ((this.help && !this.command) || !this.command || 'string' === typeof this.command) {
			const content = this.generateHelp()
			if (this.raw) {
				yield show(content, 'info', /** @type {any} */ ({ format: 'markdown', raw: true }))
				return
			}
			const title = /** @type {any} */ (this.constructor).UI?.title || 'Help'
			yield ask('help', { content, title: `${title} Help`, hint: 'content-viewer' })
			return
		}

		// Pure polymorphic call. All sub-commands MUST implement run()
		if (typeof this.command.run === 'function') {
			yield* this.command.run()
		} else {
			yield show(`Command ${this.command.constructor.name} does not implement run()`, 'error')
		}
	}

	/**
	 * Internal search for RAG and programmatic usage.
	 * @param {number[] | Float32Array} vector
	 * @param {object} [opts]
	 * @returns {Promise<Array<any>>}
	 */
	async internalSearch(vector, opts = {}) {
		const { MarkdownIndexer } = await import('./MarkdownIndexer.js')
		const scopes = ['docs', 'source']
		let allResults = []

		for (const scope of scopes) {
			const indexer = new MarkdownIndexer({ scope: /** @type {any} */ (scope) }, { ...this._ })
			const results = await indexer.search(/** @type {any} */ (vector), opts)
			allResults.push(...results)
		}

		allResults.sort((a, b) => a.score - b.score)
		return allResults.slice(0, opts.limit || 10)
	}
}
