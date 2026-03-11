import { createOpenAI } from '@ai-sdk/openai'
import { createCerebras } from '@ai-sdk/cerebras'
import { createHuggingFace } from '@ai-sdk/huggingface'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { streamText, generateText } from 'ai'
import { ModelProvider } from './ModelProvider.js'
import { ModelInfo } from './ModelInfo.js'
import { Usage } from './Usage.js'
import { ModelError } from '@nan0web/types'

/** @typedef {"free" | "cheap" | "expensive"} AiStrategyFinance - mighe be available from the ModelInfo */
/** @typedef {"low" | "mid" | "high"} AiStrategyVolume - might be extracted from hugging_face_id */
/** @typedef {"slow" | "fast"} AiStrategySpeed - might be calculated by stats */
/** @typedef {"simple" | "smart" | "expert"} AiStrategyLevel - might be calculated by stats */

/**
 * @typedef {Object} StreamOptions callbacks and abort signal
 * @property {AbortSignal} [abortSignal] aborts the request when signaled
 * @property {import('ai').StreamTextOnChunkCallback<import('ai').ToolSet>} [onChunk] called for each raw chunk
 * @property {import('ai').StreamTextOnStepFinishCallback<import('ai').ToolSet>} [onStepFinish] called after a logical step finishes (see description above)
 * @property {import('ai').StreamTextOnErrorCallback} [onError] called on stream error
 * @property {()=>void} [onFinish] called when the stream ends successfully
 * @property {()=>void} [onAbort] called when the stream is aborted
 */

class AiStrategy {
	static finance = {
		help: `A finance limit that is calculated by prompt, completion cost per token.
  - free - for models with prompt and completion prices = 0
  - cheap - for models with prompt and completion prices below medium of all available
  - expensive - for models with prompt and completion prices equal and above the medium of all available
`,
		/** @type {AiStrategyFinance[]} */
		enum: ['free', 'cheap', 'expensive'],
		/** @type {AiStrategyFinance} */
		default: 'free',
	}
	/**
	 * A finance limit that is calculated by prompt, completion cost per token.
	 * - `free` - for models with prompt and completion prices = 0
	 * - `cheap` - for models with prompt and completion prices below medium of all available
	 * - `expensive` - for models with prompt and completion prices equal and above the medium of all available
	 * @type {"free" | "cheap" | "expensive"}
	 */
	finance = AiStrategy.finance.default
	static speed = {
		help: `The response speed.
  - slow - for models with the response speed above the medium of all available
  - fast - for models with the response speed below the medium of all available`,
		/** @type {AiStrategySpeed[]} */
		enum: ['slow', 'fast'],
		/** @type {AiStrategySpeed} */
		default: 'fast',
	}
	/**
	 * The response speed.
	 * - `slow` - for models with the response speed above the medium of all available
	 * - `fast` - for models with the response speed below the medium of all available
	 * @type {AiStrategySpeed}
	 */
	speed = AiStrategy.speed.default
	static volume = {
		help: `The total parameters amount of the model divided into 3 medium ranges to select from: A, B, C.
  - low - from 0 to billions of parameters depending on A range,
  - mod - B range
  - high - C range`,
		/** @type {AiStrategyVolume[]} */
		enum: ['low', 'mid', 'high'],
		/** @type {AiStrategyVolume} */
		default: 'mid',
	}
	/**
	 * The total parameters amount of the model divided into 3 medium ranges to select from: A, B, C.
	 * - `low` - from 0 to billions of parameters depending on A range,
	 * - `mod` - B range
	 * - `high` - C range
	 * @type {AiStrategyVolume}
	 */
	volume = 'mid'
	/**
	 * Solving issues level measured with a statistics.
	 * - `simple` - more than 20% fails
	 * - `smart` - equal or less than 20% fails
	 * - `expert` - equal or less than 2% fails
	 */
	static level = {
		help: `Solving issues level measured with a statistics.
  - simple - more than 20% fails
  - smart - equal or less than 20% fails
  - expert - equal or less than 2% fails`,
		/** @type {AiStrategyLevel[]} */
		enum: ['simple', 'smart', 'expert'],
		/** @type {AiStrategyLevel} */
		default: 'smart',
	}
	/** @type {AiStrategyLevel} */
	level = 'smart'
	static budget = {
		help: 'A budget for the current chat',
		default: 0,
	}
	/** @type {number | string} A budget for the current chat */
	budget = AiStrategy.budget.default

	static rateLimitDelayMs = {
		help: 'Delay in milliseconds before retrying after a rate limit error',
		default: 20000,
	}
	/** @type {number} */
	rateLimitDelayMs = AiStrategy.rateLimitDelayMs.default

	static rateLimitRetries = {
		help: 'Number of retries when hitting rate limits (429)',
		default: 1,
	}
	/** @type {number} */
	rateLimitRetries = AiStrategy.rateLimitRetries.default

	constructor(initial = {}) {
		Object.assign(this, initial)
	}

	/**
	 * @param {ModelInfo} model
	 * @param {number} tokens
	 * @param {number} [safeAnswerTokens=1_000]
	 * @returns {boolean}
	 */
	shouldChangeModel(model, tokens, safeAnswerTokens = 1e3) {
		if (!model) return true
		if (model.context_length < tokens + safeAnswerTokens) return true
		if (model.per_request_limit > 0 && model.per_request_limit < tokens) return true
		if (model.maximum_output > 0 && model.maximum_output < safeAnswerTokens) return true
		if (model.pricing.prompt < 0 || model.pricing.completion < 0) return true
		if (model.volume && model.volume < 100e9) return true
		if (model.id.endsWith(':free')) return true
		return false
	}
	/**
	 * @param {Map<string, ModelInfo>} models
	 * @param {number} tokens
	 * @param {number} [safeAnswerTokens=1_000]
	 * @returns {ModelInfo | undefined}
	 */
	findModel(models, tokens, safeAnswerTokens = 1e3) {
		const arr = Array.from(models.values()).filter(
			(info) => !this.shouldChangeModel(info, tokens, safeAnswerTokens),
		)
		if (!arr.length) return
		arr.sort((a, b) => a.pricing.completion - b.pricing.completion)

		return arr[0]
	}
}

/**
 * Wrapper for AI providers.
 *
 * Apart from the static model list, the class now exposes a method
 * `refreshModels()` that pulls the latest info from each provider (via
 * `api/models/`) and caches the result for one hour.
 *
 * @class
 */
export class AI {
	static Strategy = AiStrategy

	/** @type {Map<string, ModelInfo>} */
	#models = new Map()

	/** @type {ModelProvider} */
	#provider = new ModelProvider()

	/** @type {ModelInfo?} */
	selectedModel = null

	/**
	 * @param {Object} input
	 * @param {readonly[string, ModelInfo] | readonly [string, ModelInfo] | Map<string, ModelInfo>} [input.models=[]]
	 * @param {ModelInfo} [input.selectedModel]
	 * @param {AiStrategy} [input.strategy]
	 */
	constructor(input = {}) {
		const { models = [], selectedModel = this.selectedModel, strategy = new AI.Strategy() } = input
		// @ts-ignore could not solve the type error even when param copied from the original function
		this.setModels(models)
		this.selectedModel = selectedModel
		this.strategy = strategy
	}

	/**
	 * Flatten and normalize models to Map<string, ModelInfo[]>. Handles:
	 * - Map: Pass-through.
	 * - Array<[string, ModelInfo[]]>: Direct set.
	 * - Array<[string, ModelInfo]>: Wrap singles in arrays.
	 * - Nested providers (e.g., {providers: [{provider:'a'}]}): Expand to prefixed IDs (e.g., 'model:a').
	 * @param {readonly[string, ModelInfo] | readonly [string, ModelInfo] | Map<string, ModelInfo> | readonly[string, Partial<ModelInfo> & {providers?: {provider: string}[]}]} models
	 */
	setModels(models) {
		let map = new Map()
		if (models instanceof Map) {
			// Direct Map: flatten singles to arrays
			for (const [id, value] of models) {
				if (!Array.isArray(value)) {
					map.set(id, new ModelInfo(value))
				} else if (value.length) {
					map.set(id, new ModelInfo(value[0]))
				}
			}
		} else if (Array.isArray(models)) {
			// Array format: flatten as needed
			for (const item of models) {
				if (Array.isArray(item)) {
					const [id, value] = item
					if (!Array.isArray(value)) {
						map.set(id, new ModelInfo(value))
					} else if (value.length) {
						map.set(id, new ModelInfo(value[0]))
					}
				} else if (item.providers && Array.isArray(item.providers)) {
					// Nested providers: expand
					const baseId = item.id
					for (const prov of item.providers) {
						const prefixedId = `${baseId}:${prov.provider}`
						const variant = new ModelInfo({ ...item, provider: prov.provider })
						const arr = map.get(prefixedId) ?? []
						arr.push(variant)
						map.set(prefixedId, arr)
					}
				} else {
					// Single object: treat as [id, ModelInfo]
					map.set(item.id, new ModelInfo(item))
				}
			}
		}
		this.#models = map
	}

	/**
	 * Refresh model information from remote providers.
	 *
	 * The method updates the internal `#models` map with the merged static +
	 * remote data. It respects the cache (see `ModelProvider`).
	 *
	 * @returns {Promise<void>}
	 */
	async refreshModels() {
		const remote = await this.#provider.getAll()
		// Merge remote into the internal map – remote wins on ID conflict.
		for (const [id, info] of remote.entries()) {
			this.#models.set(id, info)
		}
	}

	/**
	 * Get list of available models (after optional refresh).
	 *
	 * @returns {ModelInfo[]}
	 */
	getModels() {
		return Array.from(this.#models.values()).flat()
	}

	/**
	 *
	 * @returns {Map<string, ModelInfo>}
	 */
	getModelsMap() {
		return this.#models
	}

	/**
	 * Get model info by ID.
	 *
	 * @param {string} modelId
	 * @returns {ModelInfo[]}
	 */
	getModel(modelId) {
		const keys = Array.from(this.#models.keys()).filter((id) => id.startsWith(modelId))
		const result = []
		keys.forEach((key) => {
			const info = this.#models.get(key)
			if (info?.id === modelId) {
				result.push(info)
			}
		})
		return result
	}

	/**
	 * Returns the model for the specific provider with absolute equality.
	 * @param {string} model
	 * @param {string} provider
	 * @returns {ModelInfo | undefined}
	 */
	getProviderModel(model, provider) {
		const arr = this.getModel(model)
		return arr.find((p) => p.provider === provider)
	}

	/**
	 * Find a model from all of the models by partial comparasion.
	 * @param {string} modelId The full or partial model id.
	 * @returns {ModelInfo | undefined}
	 */
	findModel(modelId) {
		const str = String(modelId).toLowerCase()
		for (const [id, info] of this.#models.entries()) {
			if (String(id).toLowerCase().includes(str)) return info
		}
	}

	/**
	 * Find models that matches modelId from all of the models by partial comparasion.
	 * @param {string} modelId The full or partial model id.
	 * @returns {ModelInfo[]}
	 */
	findModels(modelId) {
		/** @type {ModelInfo[]} */
		const result = []
		const str = String(modelId).toLowerCase()
		const parts = str.split(/[^\w]+/)
		for (const [id, info] of this.#models.entries()) {
			const lc = String(id).toLowerCase()
			if (lc.includes(str)) {
				result.push(info)
			}
			if (parts.some((p) => lc.includes(p))) {
				result.push(info)
			}
		}
		result.sort((a, b) => a.id.localeCompare(b.id))
		return result
	}

	/**
	 * Add a model to the internal map (for testing).
	 *
	 * @param {string} id
	 * @param {Partial<ModelInfo>} info
	 */
	addModel(id, info) {
		this.#models.set(`${info.id}@${info.provider}`, new ModelInfo(info))
	}

	/**
	 * Get provider instance for a model.
	 *
	 * @param {string} provider
	 * @returns {any}
	 */
	getProvider(provider) {
		const [pro] = provider.split('/')
		ModelProvider.validateApiKey(pro)
		switch (pro) {
			case 'openai':
				return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
			case 'cerebras':
				return createCerebras({ apiKey: process.env.CEREBRAS_API_KEY })
			case 'huggingface':
				const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY
				return createHuggingFace({ apiKey: HF_TOKEN })
			case 'openrouter':
				return createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })
			case 'llamacpp':
				const baseURL =
					process.env.LLAMA_CPP_URL?.replace(/\/v1\/.*$/, '') || 'http://localhost:1234'
				const openaiProvider = createOpenAI({
					apiKey: 'not-needed',
					baseURL,
					fetch: async (url, options) => {
						if (url.includes('/responses')) {
							// Llama.cpp doesn't have /responses, map to /chat/completions
							options.url = `${baseURL}/v1/chat/completions`
							if (options.body) {
								let body = JSON.parse(options.body)
								if (body.input) {
									// Convert responses format to chat completions
									const messages = body.input.map((item) => ({
										...item,
										role: item.role === 'developer' ? 'system' : item.role,
									}))
									// If user content is array, flatten it for compatibility
									const flattened = messages.map((msg) => {
										if (Array.isArray(msg.content)) {
											return {
												...msg,
												content: msg.content
													.map((c) => (c.type === 'input_text' ? c.text : ''))
													.join(''),
											}
										}
										return msg
									})
									body = {
										model: body.model,
										messages: flattened,
										temperature: body.temperature,
										top_p: body.top_p,
										max_tokens: body.max_output_tokens,
										stream: body.stream,
									}
									options.body = JSON.stringify(body)
								}
							}
						}
						return fetch(options.url, options)
					},
				})
				return openaiProvider
			default:
				throw new ModelError({
					provider: ModelProvider.ui.errorUnsupportedProvider,
					$provider: pro,
				})
		}
	}

	/**
	 * Stream text from a model.
	 *
	 * The method forwards the call to `ai.streamText` while providing a set of
	 * optional hooks that can be used by monitor or control the streaming
	 * lifecycle.
	 *
	 * @param {ModelInfo} model
	 * @param {import('ai').ModelMessage[]} messages
	/**
	 * Stream text from a model.
	 *
	 * @param {ModelInfo} model
	 * @param {import('ai').ModelMessage[]} messages
	 * @param {import('ai').UIMessageStreamOptions<import('ai').UIMessage> & StreamOptions & { tools?: import('ai').ToolSet, maxSteps?: number }} [options={}]
	 * @returns {import('ai').StreamTextResult<import('ai').ToolSet, any>}
	 */
	streamText(model, messages, options = {}) {
		const {
			abortSignal,
			onChunk,
			onStepFinish,
			onError,
			onFinish,
			onAbort,
			tools,
			maxSteps,
			system,
		} = options

		const provider = this.getProvider(model.provider)
		const specific = provider(model.id)

		const result = streamText({
			model: specific,
			messages,
			system,
			abortSignal,
			tools,
			maxSteps: tools && Object.keys(tools).length > 0 ? maxSteps || 5 : undefined,
			onChunk,
			onStepFinish,
			onError: (err) => {
				console.error('[AI Stream Error]', err)
				onError?.(err)
			},
			onFinish,
			onAbort,
		})
		return result
	}

	async generateText(model, messages, options = {}) {
		const { tools, maxSteps, system } = options
		let currentModel = model
		let attempts = this.strategy.rateLimitRetries || 0
		const triedModels = new Set()
		let lastError = null

		while (true) {
			const provider = this.getProvider(currentModel.provider)
			try {
				const { text, usage } = await generateText({
					model: provider(currentModel.id),
					messages,
					system,
					tools,
					maxSteps: tools && Object.keys(tools).length > 0 ? maxSteps || 5 : undefined,
				})
				return { text, usage: new Usage(usage), usedModel: currentModel.id, usedProvider: currentModel.provider }
			} catch (err) {
				lastError = err
				const msg = err.message.toLowerCase()
				const isRateLimit = msg.includes('429') || msg.includes('too many') || msg.includes('traffic') || msg.includes('limit exceeded') || msg.includes('rate limit')

				if (isRateLimit && attempts > 0) {
					console.warn(`[AI Strategy] Rate limit on ${currentModel.id}. Waiting ${this.strategy.rateLimitDelayMs / 1000}s... (retries left: ${attempts})`)
					attempts--
					if (this.strategy.rateLimitDelayMs > 0) {
						await new Promise(r => setTimeout(r, this.strategy.rateLimitDelayMs))
					}
					continue
				}

				// Exclude the failed model
				triedModels.add(currentModel.id + '@' + currentModel.provider)
				
				// Estimate tokens roughly
				const estimatedTokens = JSON.stringify(messages).length / 4 
				const safeAnswerTokens = 1000
				
				// Find all viable fallbacks
				const fallbackCandidates = Array.from(this.#models.values()).filter(info => {
					if (triedModels.has(info.id + '@' + info.provider)) return false
					return !this.strategy.shouldChangeModel(info, estimatedTokens, safeAnswerTokens)
				})

				if (!fallbackCandidates.length) {
					console.error(`[AI Strategy] Mapped sequence failed. No more fallback models available. Last error: ${err.message}`)
					throw err
				}

				// Sort fallbacks by completion price
				fallbackCandidates.sort((a, b) => (a.pricing?.completion || 0) - (b.pricing?.completion || 0))
				
				currentModel = fallbackCandidates[0]
				console.warn(`[AI Strategy] Fallback to next best model: ${currentModel.id} (${currentModel.provider})`)
				attempts = this.strategy.rateLimitRetries || 0
			}
		}
	}

	/**
	 * @throws {Error} When no correspondent model found.
	 * @param {ModelInfo} model
	 * @param {number} tokens
	 * @param {number} [safeAnswerTokens=1_000]
	 * @returns {ModelInfo | undefined}
	 */
	ensureModel(model, tokens, safeAnswerTokens = 1e3) {
		if (!this.strategy.shouldChangeModel(model, tokens, safeAnswerTokens)) {
			return model
		}
		const found = this.strategy.findModel(this.#models, tokens, safeAnswerTokens)
		if (!found) {
			throw new ModelError({
				model: AI.ui?.errorModelNotFound || 'No such model found in {strategy}',
				$strategy: this.strategy.constructor.name,
			})
		}
		this.selectedModel = found
		return found
	}
}
