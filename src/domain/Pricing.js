import { Model } from '@nan0web/types'
import { Usage } from './Usage.js'

/**
 * Pricing — represents pricing information for a model.
 * Inherits from Model to follow the universal Model-as-Schema pattern.
 */
export class Pricing extends Model {
	static completion = { help: 'Completion cost per million tokens', default: 0 }
	static image = { help: 'Image generation cost', default: 0 }
	static input_cache_read = { help: 'Input cache read cost', default: 0 }
	static input_cache_write = { help: 'Input cache write cost', default: 0 }
	static internal_reasoning = { help: 'Internal reasoning cost', default: 0 }
	static prompt = { help: 'Prompt cost per million tokens', default: 0 }
	static request = { help: 'Per-request cost', default: 0 }
	static web_search = { help: 'Web search cost', default: 0 }
	static speed = { help: 'Average speed in tokens/second', default: 0 }

	/**
	 * @param {Partial<Pricing> & { input?: number, output?: number } | Record<string, any>} [data] Initial state with optional and legacy aliases
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		// Handle legacy input/output aliases
		// @ts-ignore
		const { input, output, ...rest } = data
		super(
			{
				...rest,
				prompt: input ?? data.prompt ?? Pricing.prompt.default,
				completion: output ?? data.completion ?? Pricing.completion.default,
			},
			options,
		)

		/** @type {number} Completion cost / 1M tokens */ this.completion = Number(this.completion)
		/** @type {number} Cost per image generated */ this.image = Number(this.image)
		/** @type {number} Cache reading cost */ this.input_cache_read = Number(this.input_cache_read)
		/** @type {number} Cache writing cost */ this.input_cache_write = Number(this.input_cache_write)
		/** @type {number} LLM thinking cost */ this.internal_reasoning = Number(
			this.internal_reasoning,
		)
		/** @type {number} Prompt cost / 1M tokens */ this.prompt = Number(this.prompt)
		/** @type {number} Fixed price per API call */ this.request = Number(this.request)
		/** @type {number} Tool-call search cost */ this.web_search = Number(this.web_search)
		/** @type {number} Avg speed in tokens/sec */ this.speed = Number(this.speed)
	}

	/**
	 * Returns the Batch discount in %.
	 * @returns {[inputDiscount: number, outputDiscount: number]}
	 */
	getBatchDiscount() {
		return [0, 0]
	}

	/**
	 * Calculates the usage cost (total price).
	 * @param {Usage} usage
	 * @param {{ input?: number, reason?: number, output?: number }} [context] reset pricing in the context.
	 * @returns {number}
	 */
	calc(usage, context = {}) {
		const { inputTokens = 0, reasoningTokens = 0, outputTokens = 0 } = usage
		const cacheRead = Math.max(0, this.input_cache_read)
		const cacheWrite = Math.max(0, this.input_cache_write)
		const prompt = Math.max(0, this.prompt)
		const completion = Math.max(0, this.completion)
		context.input = ((prompt + cacheRead) * inputTokens) / 1e6
		context.reason = ((completion + cacheWrite) * reasoningTokens) / 1e6
		context.output = ((completion + cacheWrite) * outputTokens) / 1e6
		return context.input + context.reason + context.output
	}
}
