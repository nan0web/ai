import { Model } from '@nan0web/types'
import { Limits } from './Limits.js'

/**
 * Timing — tracks response timing at various stages.
 */
export class Timing extends Model {
	static queued = { help: 'Timestamp when request was queued', default: () => Date.now() }
	static started = { help: 'Timestamp when request processing started', default: 0 }
	static prompted = { help: 'Timestamp when first chunk was received', default: 0 }
	static understood = { help: 'Timestamp when reasoning was completed', default: 0 }
	static completed = { help: 'Timestamp when response was fully completed', default: 0 }

	/**
	 * @param {Partial<Timing> | Record<string, any>} [data] Initial timestamps
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {number} Request creation UTC */ this.queued = Number(this.queued)
		/** @type {number} API fetch call UTC */ this.started = Number(this.started)
		/** @type {number} First chunk received UTC */ this.prompted = Number(this.prompted)
		/** @type {number} Logic/Reasoning done UTC */ this.understood = Number(this.understood)
		/** @type {number} Full response received UTC */ this.completed = Number(this.completed)
	}

	get queueTime() {
		return this.started ? this.started - this.queued : 0
	}
	get promptTime() {
		return this.prompted ? this.prompted - this.started : 0
	}
	get understoodTime() {
		return this.understood ? this.understood - this.started : 0
	}
	get completionTime() {
		return this.completed ? this.completed - this.started : 0
	}
	get totalTime() {
		return this.queueTime + this.completionTime
	}

	toString() {
		return `q: ${this.queueTime}; p: ${this.promptTime}; r: ${this.understoodTime}; c: ${this.completionTime} = ${this.totalTime}`
	}
}

/**
 * Usage — represents token usage and timing for an AI request.
 */
export class Usage extends Model {
	static inputTokens = { help: 'Tokens in the prompt', default: 0 }
	static reasoningTokens = { help: 'Tokens spent on internal reasoning', default: 0 }
	static outputTokens = { help: 'Tokens in the response completion', default: 0 }
	static cachedInputTokens = { help: 'Tokens read from cache', default: 0 }
	static limits = { help: 'Remaining rate limits', default: {} }
	static timing = { help: 'Timing metrics for the request', default: {} }

	/**
	 * @param {Partial<Usage> | Record<string, any>} [data] Initial token counts
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {number} Prompt token count */ this.inputTokens = Number(this.inputTokens)
		/** @type {number} Internal thought tokens */ this.reasoningTokens = Number(
			this.reasoningTokens,
		)
		/** @type {number} Completion token count */ this.outputTokens = Number(this.outputTokens)
		/** @type {number} Cached tokens used */ this.cachedInputTokens = Number(this.cachedInputTokens)
		/** @type {Limits} Current rate limit state */ this.limits = new Limits(this.limits)
		/** @type {Timing} Timing benchmarks */ this.timing = new Timing(this.timing)
	}

	/** @returns {number} */
	get totalTokens() {
		return this.inputTokens + this.reasoningTokens + this.outputTokens
	}

	/**
	 * No-op setter to allow Object.assign in Model.js to safely skip or
	 * overwrite this derived property during instantiation.
	 * @param {any} _v
	 */
	set totalTokens(_v) {}
}
