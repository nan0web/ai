import { Usage } from './Usage.js'

/**
 * Represents pricing information for a model.
 */
export class Pricing {
	/** @type {number} - Completion cost per million tokens */
	completion = 0
	/** @type {number} - Image cost */
	image = 0
	/** @type {number} - Input cache read cost */
	input_cache_read = 0
	/** @type {number} - Input cache write cost */
	input_cache_write = 0
	/** @type {number} - Internal reasoning cost */
	internal_reasoning = 0
	/** @type {number} - Prompt cost per million tokens */
	prompt = 0
	/** @type {number} - Request cost */
	request = 0
	/** @type {number} - Web search cost */
	web_search = 0
	/** @type {number} - average speed T/s */
	speed = 0

	/**
	 * @param {Partial<Pricing> & { input?: number, output?: number }} options
	 */
	constructor(options = {}) {
		const {
			completion = this.completion,
			image = this.image,
			input_cache_read = this.input_cache_read,
			input_cache_write = this.input_cache_write,
			internal_reasoning = this.internal_reasoning,
			prompt = this.prompt,
			request = this.request,
			web_search = this.web_search,
			speed = this.speed,
			input,
			output,
		} = options
		this.completion = Number(output ?? completion)
		this.image = Number(image)
		this.input_cache_read = Number(input_cache_read)
		this.input_cache_write = Number(input_cache_write)
		this.internal_reasoning = Number(internal_reasoning)
		this.prompt = Number(input ?? prompt)
		this.request = Number(request)
		this.web_search = Number(web_search)
		this.speed = Number(speed)
	}

	/**
	 * Returns the Batch discount in %.
	 * @returns {[inputDicount: number, outputDiscount: number]}
	 */
	getBatchDiscount() {
		// @todo implement for those where it works, it is not working with openrouter,
		// but should work with openai.
		return [0, 0]
		if (!this.input_cache_read && this.input_cache_write) return [0, 0]
		return [
			Math.round((1 - this.input_cache_read / this.prompt) * 100),
			Math.round((1 - this.input_cache_write / this.completion) * 100),
		]
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
