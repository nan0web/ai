import { Model, ModelError } from '@nan0web/types'
import hnswlib from 'hnswlib-node'
import path from 'node:path'
import fs from 'node:fs'
import { DBFS } from '@nan0web/db-fs'
const fsp = fs.promises

/**
 * VectorDB — HNSW vector index with metadata storage.
 * Inherits from Model to follow Model-as-Schema v2.
 *
 * Uses `this._.db` for file persistence (save/load).
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
		/** @type {number} Max element capacity */ this.maxElements = Math.max(
			1,
			Number(this.maxElements || 100000),
		)

		// Ensure db is always available (fixes callback-based fs crash in MCP server)
		if (!this._.db) {
			this._.db = new DBFS()
		}

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
		if (num <= 0) return []

		let results
		try {
			results = this._index.searchKnn(arr, num)
		} catch (e) {
			console.error(
				`VectorDB.search failed for ${num} neighbors. maxElements: ${this.maxElements}, dim: ${this.dim}, space: ${this.space}`,
				e,
			)
			throw e
		}

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
	 * @param {string} filePath
	 */
	async save(filePath) {
		const db = /** @type {any} */ (this._.db)
		const metaPath = filePath + '.meta.json'
		const mdJson = {
			nextId: this._nextId,
			dim: this.dim,
			space: this.space,
			maxElements: this.maxElements,
			entries: Array.from(this._metadata.entries()),
		}

		const absPath = db.location(filePath)
		await fsp.mkdir(path.dirname(absPath), { recursive: true })
		this._index.writeIndexSync(absPath)
		await db.saveDocument(metaPath, mdJson)
	}

	/**
	 * Loads a previously persisted HNSW index and metadata from disk.
	 * @param {string} filePath
	 * @param {object} [opts]
	 * @param {boolean} [opts.metaOnly=false]
	 * @returns {Promise<boolean>}
	 */
	async load(filePath, opts = {}) {
		const db = /** @type {any} */ (this._.db)
		const metaPath = filePath + '.meta.json'
		const metaOnly = opts.metaOnly || false

		const stat = await db.statDocument(metaPath)
		if (!stat.exists) return false

		const metaObj = (await db.get(metaPath)) ?? {}
		this._applyMeta(metaObj, false)

		if (metaOnly) return true

		const absPath = db.location(filePath)
		this._index.readIndexSync(absPath)
		return true
	}

	_applyMeta(metaObj, init = true) {
		if (metaObj.dim) this.dim = Number(metaObj.dim)
		if (metaObj.space) this.space = String(metaObj.space)
		this.maxElements = Math.max(1, Number(metaObj.maxElements || this.maxElements || 100000))

		this._index = new hnswlib.HierarchicalNSW(/** @type {*} */ (this.space), this.dim)
		if (init) {
			this._index.initIndex(this.maxElements)
		}

		this._nextId = metaObj.nextId || 0
		this._metadata = new Map(metaObj.entries || [])
	}
}
