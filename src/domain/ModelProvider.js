/**
 * ModelProvider – fetches model metadata from supported providers and caches it.
 *
 * Each provider has its own endpoint that returns a list of available models.
 * The result is stored in a JSON file under the project cache directory so that
 * subsequent calls within the cache TTL do not hit the network.
 *
 * The public API:
 *   - `getAll()` – returns a `Map<string, ModelInfo>`
 *     with the union of all provider models (local + remote).
 *
 * @module llm/ModelProvider
 */

import { ModelError } from '@nan0web/types'

import CerebrasInfo from '../providers/cerebras.info.js'
import HuggingFaceInfo from '../providers/huggingface.info.js'
import OpenrouterInfo from '../providers/openrouter.info.js'
import { ModelInfo } from './ModelInfo.js'
import { Pricing } from './Pricing.js'
import llamacppInfo from '../providers/llamacpp.info.js'
import GoogleInfo from '../providers/google.info.js'
import GroqInfo from '../providers/groq.info.js'

const transformers = {
	cerebras: CerebrasInfo.makeFlat,
	huggingface: HuggingFaceInfo.makeFlat,
	openrouter: OpenrouterInfo.makeFlat,
	llamacpp: llamacppInfo.makeFlat,
	google: GoogleInfo.makeFlat,
	groq: GroqInfo.makeFlat,
}

/** @typedef {"cerebras" | "openrouter" | "huggingface" | "llamacpp"} AvailableProvider */
/**
 * @typedef {Object} HuggingFaceProviderInfo
 * @property {string} provider
 * @property {string} status
 * @property {number} context_length
 * @property {{ input: number, output: number }} pricing
 * @property {boolean} supports_tools
 * @property {boolean} supports_structured_output
 * @property {boolean} is_model_author
 */

class CacheConfig {
	/** @type {number} Cache duration – 1 hour (in milliseconds) */
	ttl = 60 * 60 * 1e3
	file = 'chat/cache/{provider}.jsonl'
	/** @param {Partial<CacheConfig>} [input] */
	constructor(input = {}) {
		const { ttl = this.ttl, file = this.file } = input
		this.ttl = Number(ttl)
		this.file = String(file)
	}
	/**
	 * @param {string} provider
	 * @return {string}
	 */
	getFile(provider) {
		return this.file.replaceAll('{provider}', provider)
	}
	/**
	 * @param {number} time File change time in milliseconds
	 * @param {number} [now] Now time in milliseconds
	 * @returns {boolean}
	 */
	isAlive(time, now = Date.now()) {
		return now - time < this.ttl
	}
}

export const ProviderConfig = {}

export class ModelProvider {
	/** @type {AvailableProvider[]} */
	static AvailableProviders = ['cerebras', 'huggingface', 'openrouter', 'llamacpp', 'google', 'groq']
	/** @type {any} */
	#fs
	/** @type {CacheConfig} */
	#cache

	static ui = {
		errorApiKeyReq: '{provider} API key is missing. Set the {envVar} environment variable.',
		errorCerebrasNotice: `Cerebras API key is missing. Set the {envVar} environment variable.\n\nTo get an API key:\n1. Visit https://inference-docs.cerebras.ai/\n2. Sign up and get your API key\n3. Export it: export {envVar}=your_key_here`,
		errorUnsupportedProvider: 'Unsupported provider "{provider}"',
		errorFetchFailed: 'Failed to fetch {url}: {status} {statusText}',
	}

	/**
	 * Returns true if the API key for the provider is present.
	 * @param {string} provider
	 * @returns {boolean}
	 */
	static hasApiKey(provider) {
		switch (provider) {
			case 'cerebras':
				return !!process.env.CEREBRAS_API_KEY
			case 'openai':
				return !!process.env.OPENAI_API_KEY
			case 'openrouter':
				return !!process.env.OPENROUTER_API_KEY
			case 'huggingface':
				return !!(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY)
			case 'google':
				return !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY)
			case 'groq':
				return !!process.env.GROQ_API_KEY
			case 'llamacpp':
				return true
			default:
				return false
		}
	}

	/**
	 * Validates API key for a provider and throws if missing.
	 * @param {string} provider - Provider name (e.g., 'openai')
	 * @throws {ModelError} If API key is missing, with provider-specific help.
	 */
	static validateApiKey(provider) {
		if (this.hasApiKey(provider)) return
		switch (provider) {
			case 'cerebras':
				throw new ModelError({
					api: ModelProvider.ui.errorCerebrasNotice,
					$provider: 'Cerebras',
					$envVar: 'CEREBRAS_API_KEY',
				})
			case 'openai':
				throw new ModelError({
					api: ModelProvider.ui.errorApiKeyReq,
					$provider: 'OpenAI',
					$envVar: 'OPENAI_API_KEY',
				})
			case 'openrouter':
				throw new ModelError({
					api: ModelProvider.ui.errorApiKeyReq,
					$provider: 'OpenRouter',
					$envVar: 'OPENROUTER_API_KEY',
				})
			case 'huggingface':
				throw new ModelError({
					api: ModelProvider.ui.errorApiKeyReq,
					$provider: 'Hugging Face',
					$envVar: 'HF_TOKEN',
				})
			case 'google':
				throw new ModelError({
					api: ModelProvider.ui.errorApiKeyReq,
					$provider: 'Google',
					$envVar: 'GOOGLE_API_KEY',
				})
			case 'groq':
				throw new ModelError({
					api: ModelProvider.ui.errorApiKeyReq,
					$provider: 'Groq',
					$envVar: 'GROQ_API_KEY',
				})
			case 'llamacpp':
				// No API key needed for local llama.cpp
				break
			default:
				throw new ModelError({
					provider: ModelProvider.ui.errorUnsupportedProvider,
					$provider: provider,
				})
		}
	}

	constructor(input = {}) {
		const { fs = null, cache = new CacheConfig() } = input
		this.#fs = fs
		this.#cache = cache
	}

	get cachePath() {
		return this.#cache.file
	}

	get cacheConfig() {
		return this.#cache
	}

	/**
	 * Load the cache file if it exists and is fresh.
	 * @param {string} provider
	 * @returns {Promise<object[] | null>}
	 */
	async loadCache(provider) {
		if (!this.#fs) return null
		const file = this.cacheConfig.getFile(provider)
		try {
			if (await this.#fs.access(file)) {
				const rows = (await this.#fs.load(file)) ?? []
				if (!rows.length) return null
				const stats = await this.#fs.info(file)
				if (this.cacheConfig.isAlive(stats.mtimeMs)) {
					return rows
				}
			}
		} catch (/** @type {any} */ err) {
			// Ignore cache read errors – fall back to fresh fetch.
			console.debug(`Cache load failed: ${err.message}`)
		}
		return null
	}

	/**
	 * Write fresh data to the cache as JSONL (one model per line).
	 * @param {any} data
	 * @param {string} provider
	 */
	async writeCache(data, provider) {
		if (!this.#fs) return
		await this.#fs.save(this.cacheConfig.getFile(provider), data)
	}

	/**
	 * Fetch model list from a provider endpoint.
	 *
	 * The function knows how to call each supported provider.
	 *
	 * @param {AvailableProvider} provider
	 * @returns {Promise<Array<Partial<ModelInfo> & {id: string}>>} Raw model data.
	 */
	async fetchFromProvider(provider) {
		ModelProvider.validateApiKey(provider)
		switch (provider) {
			case 'cerebras':
				return await this.#jsonFetch(`https://api.cerebras.ai/v1/models`, {
					Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
				})
			case 'openrouter':
				return await this.#jsonFetch(`https://openrouter.ai/api/v1/models`, {
					Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
				})
			case 'huggingface':
				const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY
				// Note: Hugging Face router API may not provide full model list; fallback to static.
				// Endpoint for inference models: https://huggingface.co/docs/api-inference/models
				try {
					return await this.#jsonFetch('https://router.huggingface.co/v1/models', {
						Authorization: `Bearer ${HF_TOKEN}`,
					})
				} catch (/** @type {any} */ err) {
					console.debug(`HF fetch failed, using static: ${err.message}`)
					return [] // Fallback to static info only.
				}
			case 'google':
				// @todo implement fetch models from google
				return []
			case 'groq':
				return await this.#jsonFetch(`https://api.groq.com/openai/v1/models`, {
					Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
				})
			default:
				return []
		}
	}

	/**
	 *
	 * @param {string | URL | globalThis.Request} url
	 * @param {RequestInit} options
	 * @returns {Promise<Response>}
	 */
	async fetch(url, options) {
		return await fetch(url, options)
	}

	/**
	 * Generic JSON fetch – uses native fetch (Node ≥ 18) and validates response.
	 * Adds provider‑specific headers (e.g. Authorization for Cerebras).
	 *
	 * @param {string} url
	 * @param {object} [headers={}]
	 * @returns {Promise<Array>}
	 */
	async #jsonFetch(url, headers = {}) {
		const resp = await this.fetch(url, { headers: { ...headers, Accept: 'application/json' } })
		if (!resp.ok) {
			throw new ModelError({
				api: ModelProvider.ui.errorFetchFailed,
				$url: url,
				$status: resp.status,
				$statusText: resp.statusText,
			})
		}
		const json = /** @type {any} */ (await resp.json())
		// Providers may return an array directly or wrap it in a property.
		if (Array.isArray(json)) return json
		if (Array.isArray(json.data)) return json.data
		if (Array.isArray(json.models)) return json.models
		// Fallback to empty array – caller will handle absence gracefully.
		return []
	}

	/**
	 * Flatten multi-provider entries into separate ModelInfo instances.
	 * @param {Array<ModelInfo & { providers?: HuggingFaceProviderInfo[] }>} arr
	 * @param {AvailableProvider} provider
	 * @param {Array<[string, Partial<ModelInfo>]>} [predefined]
	 * @returns {ModelInfo[]}
	 */
	_makeFlat(arr, provider, predefined = []) {
		const map = new Map(predefined)
		const result = []
		const push = (item) => {
			if (item) {
				if ('openrouter' === provider) {
					this.#multiply(item, 1e6)
				}
				result.push(item)
			}
		}
		for (const model of arr) {
			const pre = map.get(model.id) ?? {}
			if (model.providers && Array.isArray(model.providers)) {
				for (const opts of model.providers) {
					const pro = provider + '/' + (opts.provider ?? '')
					if (pro.endsWith('/')) {
						console.warn("Incorrect model's provider: " + pro)
						continue
					}
					const { providers, ...rest } = model
					// @todo transform platform-specific info into ModelInfo before pushing it
					// supports only HuggingFace providers, and OpenRouter flat version
					// @ts-ignore
					push(new ModelInfo({ ...pre, ...rest, ...opts, provider: pro }))
				}
			} else {
				push(new ModelInfo({ ...pre, ...model, provider: provider ?? model.provider }))
			}
		}
		return result
	}

	/**
	 *
	 * @param {ModelInfo} model
	 * @param {number} rate
	 */
	#multiply(model, rate = 1) {
		const fields = [
			'completion',
			'input_cache_read',
			'input_cache_write',
			'internal_reasoning',
			'prompt',
		]
		model.pricing ??= new Pricing({})
		for (const field of fields) {
			if (model.pricing[field] > 0) {
				model.pricing[field] *= rate
			}
		}
		return model
	}

	/**
	 * Return a map of model-id → array of ModelInfo (one per provider variant).
	 *
	 * Attempts cache first. If stale/missing, fetches from providers, merges with static info,
	 * updates cache, and returns. Errors per-provider are swallowed, falling back to static.
	 *
	 * @param {object} [options={}]
	 * @param {function(string, string[]): void} [options.onBefore] Called before fetch.
	 * @param {function(string, any, ModelInfo[]): void} [options.onData] Called after normalization.
	 * @param {boolean} [options.noCache]
	 * @returns {Promise<Map<string, ModelInfo>>}
	 */
	async getAll(options = {}) {
		/**
		 * @param {ModelInfo[]} all
		 * @returns {Map<string, ModelInfo>}
		 */
		const convertMap = (all) => {
			const map = new Map()
			all
				.filter((m) => typeof m.id === 'string' && m.id.length > 0)
				.forEach((m) => {
					const id = [m.id, m.provider].join('@')
					map.set(id, m)
				})
			return map
		}

		const { onBefore = () => {}, onData = () => {}, noCache = false } = options

		/** @type {ModelInfo[]} */
		const all = []

		for (const name of ModelProvider.AvailableProviders) {
			try {
				onBefore(name, ModelProvider.AvailableProviders)
				let raw = []
				// Fetch if possible, else use static only.
				try {
					// Try cache first.
					const cached = noCache ? null : await this.loadCache(name)
					if (cached) {
						raw = cached
					} else if (ModelProvider.hasApiKey(name)) {
						raw = await this.fetchFromProvider(name)
						if (!noCache) await this.writeCache(raw, name)
					}
				} catch (/** @type {any} */ err) {
					console.debug(`Fetch failed for ${name}, using static: ${err.message}`)
					raw = [] // Rely on predefined.
				}

				const flat = this.flatten(raw, name)
				onData(name, raw, flat)
				all.push(...flat)
			} catch (/** @type {any} */ err) {
				console.debug(`Failed to process ${name}: ${err.message}`)
			}
		}

		return convertMap(all)
	}

	/**
	 * @param {Array} raw
	 * @param {AvailableProvider} name
	 * @returns {ModelInfo[]}
	 */
	flatten(raw, name) {
		const transformer = transformers[name] ?? ((models) => models)
		return transformer(raw)
	}
}
