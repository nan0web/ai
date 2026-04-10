import { Model } from '@nan0web/types'

/**
 * Limits — represents rate limits for AI requests and tokens.
 * Inherits from Model to follow the universal Model-as-Schema pattern.
 * Supports provider-specific aliases for mapping during instantiation.
 */
export class Limits extends Model {
	static rpd = {
		help: 'Remaining requests per day',
		default: 0,
		alias: 'x-ratelimit-remaining-requests-day',
	}
	static rph = {
		help: 'Remaining requests per hour',
		default: 0,
		alias: 'x-ratelimit-remaining-requests-hour',
	}
	static rpm = {
		help: 'Remaining requests per minute',
		default: 0,
		alias: 'x-ratelimit-remaining-requests-minute',
	}
	static tpd = {
		help: 'Remaining tokens per day',
		default: 0,
		alias: 'x-ratelimit-remaining-tokens-day',
	}
	static tph = {
		help: 'Remaining tokens per hour',
		default: 0,
		alias: 'x-ratelimit-remaining-tokens-hour',
	}
	static tpm = {
		help: 'Remaining tokens per minute',
		default: 0,
		alias: 'x-ratelimit-remaining-tokens-minute',
	}

	/**
	 * @param {Partial<Limits> | Record<string, any>} [data] Initial state with optional aliased headers
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		// Resolve aliases before calling super
		const resolved = { ...data }
		Object.entries(Limits).forEach(([name, config]) => {
			if (config.alias && resolved[config.alias] !== undefined && resolved[name] === undefined) {
				resolved[name] = resolved[config.alias]
			}
		})
		super(resolved, options)
		/** @type {number} Requests per Day remaining */ if (this.rpd !== undefined)
			this.rpd = Number(this.rpd)
		/** @type {number} Requests per Hour remaining */ if (this.rph !== undefined)
			this.rph = Number(this.rph)
		/** @type {number} Requests per Minute remaining */ if (this.rpm !== undefined)
			this.rpm = Number(this.rpm)
		/** @type {number} Tokens per Day remaining */ if (this.tpd !== undefined)
			this.tpd = Number(this.tpd)
		/** @type {number} Tokens per Hour remaining */ if (this.tph !== undefined)
			this.tph = Number(this.tph)
		/** @type {number} Tokens per Minute remaining */ if (this.tpm !== undefined)
			this.tpm = Number(this.tpm)
	}

	/** @returns {boolean} */
	get empty() {
		return !this.rpd && !this.rph && !this.rpm && !this.tpd && !this.tph && !this.tpm
	}
}
