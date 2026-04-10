import { Model } from '@nan0web/types'

/**
 * AiStrategy — defines the behavioral constraints and selection rules for AI models.
 *
 * Follows Model-as-Schema pattern for automatic UI generation and validation.
 */
export class AiStrategy extends Model {
	static finance = {
		help: `A finance limit that is calculated by prompt, completion cost per token.
  - free: only pricing = 0
  - cheap: below medium prices
  - expensive: no price limits`,
		options: ['free', 'cheap', 'expensive'],
		default: 'free',
	}

	static speed = {
		help: `Desired response speed.
  - slow: favors larger models
  - fast: favors models with high T/s or low volume`,
		options: ['slow', 'fast'],
		default: 'fast',
	}

	static volume = {
		help: `The total parameters range:
  - low: < 20B
  - mid: 20B - 100B
  - high: > 100B`,
		options: ['low', 'mid', 'high'],
		default: 'mid',
	}

	static level = {
		help: `Cognitive ability level:
  - simple: basic tasks
  - smart: reasoning tasks
  - expert: complex coding/logic`,
		options: ['simple', 'smart', 'expert'],
		default: 'smart',
	}

	static budget = {
		help: 'A budget cap for the current session (USD)',
		default: 0,
		validate: (v) => Number(v) >= 0 || 'Budget must be a non-negative number',
	}

	static rateLimitDelayMs = {
		help: 'Delay in milliseconds before retrying after a rate limit error (429)',
		default: 20000,
	}

	static rateLimitRetries = {
		help: 'Number of retries when hitting rate limits',
		default: 1,
	}

	/**
	 * @param {Partial<AiStrategy> | Record<string, any>} [data] Initial state
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {"free" | "cheap" | "expensive"} Pricing constraint */ this.finance
		/** @type {"slow" | "fast"} Preferred model speed */ this.speed
		/** @type {"low" | "mid" | "high"} Parameter count range */ this.volume
		/** @type {"simple" | "smart" | "expert"} Cognitive level */ this.level
		/** @type {number} Session budget in USD */ this.budget
		/** @type {number} ms to wait on 429 error */ this.rateLimitDelayMs
		/** @type {number} Retries on rate limit */ this.rateLimitRetries
		this.budget = Number(this.budget)
		this.rateLimitDelayMs = Number(this.rateLimitDelayMs)
		this.rateLimitRetries = Number(this.rateLimitRetries)
	}

	/**
	 * @param {import('./ModelInfo.js').ModelInfo} model
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
		return false
	}

	/**
	 * @param {Map<string, import('./ModelInfo.js').ModelInfo>} models
	 * @param {number} tokens
	 * @param {number} [safeAnswerTokens=1_000]
	 * @returns {import('./ModelInfo.js').ModelInfo | undefined}
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
