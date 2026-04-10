import { Model, ModelError } from '@nan0web/types'

/**
 * Embedder — computes text embeddings via an OpenAI-compatible endpoint.
 * Inherits from Model to follow Model-as-Schema v2.
 */
export class Embedder extends Model {
	static UI = {
		errorFetchFailed: 'Embedder fetch failed: {status} {statusText}',
	}

	static baseURL = {
		help: 'Base URL of the embedding API (without trailing slash)',
		default: 'http://localhost:1234/v1',
	}

	static model = {
		help: 'Embedding model identifier',
		default: 'text-embedding-multilingual-e5-large-instruct',
	}

	/**
	 * @param {Partial<Embedder> & { fetch?: typeof globalThis.fetch } | Record<string, any>} [data] Initial state with optional fetch override
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		// @ts-ignore
		const { fetch: fetchFn, ...rest } = data
		super(rest, options)
		/** @type {string} API root without slash */ this.baseURL = String(this.baseURL).replace(
			/\/$/,
			'',
		)
		/** @type {string} Target embedding model ID */ this.model
		/** @type {typeof globalThis.fetch} Fetch platform override */
		this._fetch = fetchFn || globalThis.fetch.bind(globalThis)
	}

	/**
	 * Computes embeddings for single or multiple inputs.
	 * @param {string|string[]} input
	 * @returns {Promise<number[] | number[][]>}
	 */
	async embed(input) {
		const isArray = Array.isArray(input)
		const texts = isArray ? input : [input]
		const results = await this.embedBatch(texts)
		return isArray ? results : results[0]
	}

	/**
	 * @param {string[]} texts
	 * @returns {Promise<number[][]>}
	 */
	async embedBatch(texts) {
		if (texts.length === 0) return []
		const response = await this._fetch(`${this.baseURL}/embeddings`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: this.model,
				input: texts,
			}),
		})
		if (!response.ok) {
			const errText = await response.text().catch(() => '')
			throw new ModelError({
				api: Embedder.UI.errorFetchFailed,
				$status: response.status,
				$statusText: response.statusText,
				$details: errText,
			})
		}
		const data = await response.json()
		// OpenAI compatible format expects { data: [ { index, embedding } ] }
		const sorted = data.data.sort((a, b) => a.index - b.index)
		return sorted.map((item) => item.embedding)
	}
}
