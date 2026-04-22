import { ModelAsApp } from '@nan0web/ui-cli'
import { Model } from '@nan0web/types'

/**
 * SearchSourcesIntent — OLMUI Intent for semantic search across workspace indices.
 */
export class SearchSourcesIntent extends ModelAsApp {
	static alias = 'search'
	static UI = {
		title: 'Semantic Search',
		icon: '🔍',
	}

	static query = {
		help: 'Query text to search for',
		type: 'string',
		required: true,
		positional: true,
	}

	static project = {
		help: 'Filter by project name (substring)',
		type: 'string',
		alias: 'p',
		default: null,
	}

	static limit = {
		help: 'Number of results to return',
		type: 'number',
		alias: 'k',
		default: 10,
	}

	static maxDistance = {
		help: 'Maximum distance threshold (default: 0.18)',
		type: 'number',
		alias: 'd',
		default: 0.18,
	}

	static scope = {
		help: 'Search scope: "docs" (default) or "source".',
		type: 'string',
		alias: 's',
		options: ['docs', 'source'],
		default: 'docs',
	}

	/**
	 * @param {Partial<SearchSourcesIntent> | Record<string, any>} [data] Initial state
	 * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string} */ this.query
		/** @type {string|null} */ this.project
		/** @type {"docs"|"source"} */ this.scope
		/** @type {number} */ this.limit = Number(this.limit)
		/** @type {number} */ this.maxDistance = Number(this.maxDistance)
	}
}
