import { Model } from '@nan0web/types'
import { t } from '@nan0web/i18n'
import { AiAppModel } from './AiAppModel.js'

/**
 * CLI Application Model for Workspace Indexing
 */
export class IndexWorkspaceApp extends Model {
	static UI = {
		done: '🎉 All multi-level indices updated successfully!',
	}

	static project = {
		help: 'Re-index only specific projects matching this name (e.g., "-p 0HCnAI"). Skips all others.',
		type: 'string',
		alias: 'p',
		default: null,
	}

	/**
	 * @param {Partial<IndexWorkspaceApp> | Record<string, any>} [data] Initial state
	 * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string|null} Specific project filter to re-index */ this.project
	}

	async *run() {
		// Delegate core business logic to the unified AiAppModel
		const opts = /** @type {*} */ (this._)
		const aiModel = new AiAppModel(
			{},
			{ workspaceRoot: opts.workspaceRoot, embedderUrl: opts.embedderUrl },
		)
		yield* aiModel.index({ targetProject: this.project || undefined })

		yield { type: 'log', message: opts.t(IndexWorkspaceApp.UI.done) }
	}
}
