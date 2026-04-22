import { ModelAsApp } from '@nan0web/ui-cli'

/**
 * CLI Application Model for Workspace Indexing
 */
export class IndexWorkspaceApp extends ModelAsApp {
	static alias = 'index'
	static UI = {
		done: 'All multi-level indices updated successfully!',
	}

	static project = {
		help: 'Re-index only specific projects matching this name (e.g., "-p 0HCnAI"). Skips all others.',
		type: 'string',
		alias: 'p',
		default: null,
	}

	static scope = {
		help: 'Indexing scope: "docs" (default) or "source".',
		type: 'string',
		alias: 's',
		options: ['docs', 'source'],
		default: 'docs',
	}

	static force = {
		help: 'Force re-indexing all files even if they match the cache.',
		type: 'boolean',
		alias: 'f',
		default: false,
	}

	/**
	 * @param {Partial<IndexWorkspaceApp> | Record<string, any>} [data] Initial state
	 * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string|null} Specific project filter to re-index */ this.project
		/** @type {"docs"|"source"} Indexing scope */ this.scope
		/** @type {boolean} Force re-indexing */ this.force
	}
}
