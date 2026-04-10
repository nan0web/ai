import { Model, ModelError } from '@nan0web/types'
import hnswlib from 'hnswlib-node'

/**
 * VectorDB — HNSW vector index with metadata storage.
 * Inherits from Model to follow Model-as-Schema v2.
 *
 * Uses `this._.db` for file persistence (save/load).
 * If no db is injected, falls back to direct node:fs/promises.
 */
export class VectorDB extends Model {
	static UI = {
		errorDimensionMismatch: 'Vector dimension mismatch. Expected {expected}, got {actual}',
	}

	static dim = { help: 'Embedding vector dimension', default: 1024 }
	static space = {
		help: 'Distance metric (cosine, l2, ip)',
		default: 'cosine',
		options: ['cosine', 'l2', 'ip'],
	}
	static maxElements = { help: 'Maximum number of elements in the index', default: 100000 }

	/**
	 * @param {Partial<VectorDB> | Record<string, any>} [data] Initial state
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {number} Embedding vector dimension */ this.dim = Number(this.dim)
		/** @type {string} Distance metric to use */ this.space
		/** @type {number} Max element capacity */ this.maxElements = Number(this.maxElements)

		/** @type {hnswlib.HierarchicalNSW} Native HNSW index instance */
		this._index = new hnswlib.HierarchicalNSW(/** @type {*} */ (this.space), this.dim)
		this._index.initIndex(this.maxElements)

		/** @type {Map<number, object>} ID to metadata mapping */
		this._metadata = new Map()
		/** @type {number} Auto-incrementing index ID */
		this._nextId = 0
	}

	/**
	 * @param {number[] | Float32Array} vector
	 * @param {object} [meta]
	 * @returns {number}
	 */
	addVector(vector, meta = {}) {
		const arr = Array.isArray(vector) ? vector : Array.from(vector)
		if (arr.length !== this.dim) {
			throw new ModelError({
				vector: VectorDB.UI.errorDimensionMismatch,
				$expected: this.dim,
				$actual: arr.length,
			})
		}

		const id = this._nextId++
		this._index.addPoint(arr, id)
		this._metadata.set(id, meta)
		return id
	}

	/**
	 * @param {number[] | Float32Array} vector
	 * @param {number} [k]
	 * @returns {Array<object & { id: number, distance: number }>}
	 */
	search(vector, k = 5) {
		if (this._metadata.size === 0) return []
		const arr = Array.isArray(vector) ? vector : Array.from(vector)
		if (arr.length !== this.dim) {
			throw new ModelError({
				vector: VectorDB.UI.errorDimensionMismatch,
				$expected: this.dim,
				$actual: arr.length,
			})
		}

		const num = Math.min(k, this._metadata.size)
		const results = this._index.searchKnn(arr, num)

		const output = []
		for (let i = 0; i < results.neighbors.length; i++) {
			const id = results.neighbors[i]
			const distance = results.distances[i]
			const meta = this._metadata.get(id) || {}
			output.push({ ...meta, id, distance })
		}
		return output
	}

	/**
	 * Persists the HNSW index and metadata to disk.
	 * Uses `this._.db` if injected, otherwise falls back to `node:fs/promises`.
	 * @param {string} filePath
	 */
	async save(filePath) {
		this._index.writeIndexSync(filePath)

		const metaPath = filePath + '.meta.json'
		const mdJson = {
			nextId: this._nextId,
			dim: this.dim,
			space: this.space,
			maxElements: this.maxElements,
			entries: Array.from(this._metadata.entries()),
		}

		if (this._.db) {
			await /** @type {*} */ (this._.db).save(metaPath, mdJson)
		} else {
			const fs = await import('node:fs/promises')
			await fs.writeFile(metaPath, JSON.stringify(mdJson))
		}
	}

	/**
	 * Loads a previously persisted HNSW index and metadata from disk.
	 * @param {string} filePath
	 * @returns {Promise<boolean>}
	 */
	async load(filePath) {
		const metaPath = filePath + '.meta.json'
		const fs = this._.db ? null : await import('node:fs/promises')

		try {
			if (this._.db) {
				if (!(await /** @type {*} */ (this._.db).access(metaPath))) return false
			} else {
				await /** @type {*} */ (fs).stat(filePath)
			}
		} catch {
			return false
		}

		let metaObj = {}
		if (this._.db) {
			metaObj = (await /** @type {*} */ (this._.db).load(metaPath)) ?? {}
		} else {
			const metaContent = await /** @type {*} */ (fs).readFile(metaPath, 'utf-8').catch(() => '{}')
			metaObj = JSON.parse(metaContent)
		}

		if (metaObj.dim) this.dim = metaObj.dim
		if (metaObj.space) this.space = metaObj.space
		if (metaObj.maxElements) this.maxElements = metaObj.maxElements

		this._index = new hnswlib.HierarchicalNSW(/** @type {*} */ (this.space), this.dim)
		this._index.initIndex(this.maxElements)
		this._index.readIndexSync(filePath)

		this._nextId = metaObj.nextId || 0
		this._metadata = new Map(metaObj.entries || [])
		return true
	}
}
