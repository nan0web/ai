import { Model } from '@nan0web/types'

/**
 * @typedef {Object} ChunkHashEntry
 * @property {string[]} hashes Array of chunk checksums for a specific file
 */

export class IndexCacheModel extends Model {
	static entries = {
		help: 'Mapping of file paths to their chunk hashes for cache invalidation',
		type: 'object',
		default: {},
	}

	/**
	 * @param {Partial<IndexCacheModel> | Record<string, any>} [data] Initial state
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)

		/** @type {Record<string, string[]>} Map of path to chunk checksums */
		this.entries
	}

	/**
	 * Retrieves the array of text hashes for a given file.
	 * @param {string} filePath
	 * @returns {string[]}
	 */
	getHashes(filePath) {
		return this.entries[filePath] || []
	}

	/**
	 * Stores the array of text hashes for a given file.
	 * @param {string} filePath
	 * @param {string[]} hashes
	 */
	setHashes(filePath, hashes) {
		this.entries[filePath] = [...hashes]
	}

	/**
	 * Compares a new set of hashes with the cached set to determine if the file needs re-indexing.
	 * @param {string} filePath
	 * @param {string[]} newHashes
	 * @returns {boolean} true if unchanged, false if needs re-indexing
	 */
	isUnchanged(filePath, newHashes) {
		const oldHashes = this.getHashes(filePath)
		if (oldHashes.length !== newHashes.length) return false
		for (let i = 0; i < newHashes.length; i++) {
			if (oldHashes[i] !== newHashes[i]) return false
		}
		return true
	}
}
