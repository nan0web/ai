import { Model } from '@nan0web/types'

/**
 * GetSourceIntent — OLMUI Intent for retrieving specific files from the workspace or remote registry.
 */
export class GetSourceIntent extends Model {
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
	 * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string} */ this.path
		/** @type {string} */ this.version
	}
}
