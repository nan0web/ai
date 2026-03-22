export class Embedder {
	constructor(config = {}) {
		this.baseURL = (config.baseURL || 'http://localhost:1234/v1').replace(/\/$/, '')
		this.model = config.model || 'multilingual-e5-large-instruct-q8_0'
		this._fetch = config.fetch || globalThis.fetch.bind(globalThis)
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
				input: texts
			})
		})
		if (!response.ok) {
			const errText = await response.text().catch(() => '')
			throw new Error(`Embedder fetch failed: ${response.status} ${response.statusText} ${errText}`)
		}
		const data = await response.json()
		// OpenAI compatible format expects { data: [ { index, embedding } ] }
		const sorted = data.data.sort((a, b) => a.index - b.index)
		return sorted.map(item => item.embedding)
	}
}
