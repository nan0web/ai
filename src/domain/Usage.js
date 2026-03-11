export class Limits {
	/** @type {number | undefined} Remaining requests per day */
	rpd
	static rpd = {
		alias: 'x-ratelimit-remaining-requests-day',
	}
	/** @type {number | undefined} Remaining requests per hour */
	rph
	static rph = {
		alias: 'x-ratelimit-remaining-requests-hour',
	}
	/** @type {number | undefined} Remaining requests per minute */
	rpm
	static rpm = {
		alias: 'x-ratelimit-remaining-requests-minute',
	}
	/** @type {number | undefined} Remaining tokens per day */
	tpd
	static tpd = {
		alias: 'x-ratelimit-remaining-tokens-day',
	}
	/** @type {number | undefined} Remaining tokens per hour */
	tph
	static tph = {
		alias: 'x-ratelimit-remaining-tokens-day',
	}
	/** @type {number | undefined} Remaining tokens per minute */
	tpm
	static tpm = {
		alias: 'x-ratelimit-remaining-tokens-day',
	}
	/** @param {Partial<Limits>} [input] */
	constructor(input = {}) {
		Object.entries(Limits).forEach(([name, el]) => {
			if (undefined === input[name] && input[el.alias]) input[name] = input[el.alias]
		})
		const {
			rpd = Limits.rpd.default,
			rph = Limits.rph.default,
			rpm = Limits.rpm.default,
			tpd = Limits.tpd.default,
			tph = Limits.tph.default,
			tpm = Limits.tpm.default,
		} = input
		this.rpd = undefined === rpd ? rpd : Number(rpd)
		this.rph = undefined === rph ? rph : Number(rph)
		this.rpm = undefined === rpm ? rpm : Number(rpm)
		this.tpd = undefined === tpd ? tpd : Number(tpd)
		this.tph = undefined === tph ? tph : Number(tph)
		this.tpm = undefined === tpm ? tpm : Number(tpm)
	}
	/** @returns {boolean} */
	get empty() {
		return (
			undefined === this.rpd &&
			undefined === this.rph &&
			undefined === this.rpm &&
			undefined === this.tpd &&
			undefined === this.tph &&
			undefined === this.tpm
		)
	}
}

export class Timing {
	/** @type {number} The time in milliseconds when queued */
	queued = Date.now()
	/** @type {number} The time in milliseconds when reading is started in the queue */
	started = 0
	/** @type {number} The time in milliseconds when first chunk returned */
	prompted = 0
	/** @type {number} The time in milliseconds when reasoning is complete */
	understood = 0
	/** @type {number} The time in milliseconds when response is complete */
	completed = 0

	/** @param {Partial<Timing>} [input] */
	constructor(input = {}) {
		Object.assign(this, input)
	}
	/** @returns {number} The time in milliseconds spent on completion */
	get queueTime() {
		return this.started ? this.started - this.queued : 0
	}
	/** @returns {number} The time in milliseconds spent on prompt reading */
	get promptTime() {
		return this.prompted ? this.prompted - this.started : 0
	}
	/** @returns {number} The time in milliseconds spent on reasoning */
	get understoodTime() {
		return this.prompted ? this.prompted - this.started : 0
	}
	/** @returns {number} The time in milliseconds spent on completion */
	get completionTime() {
		return this.completed ? this.completed - this.started : 0
	}
	/** @returns {number} The time in milliseconds spent on completion and queue */
	get totalTime() {
		return this.queueTime + this.completionTime
	}
	/** @returns {string} */
	toString() {
		return `q: ${this.queueTime}; p: ${this.promptTime}; r: ${this.understoodTime}; c: ${this.completionTime} = ${this.totalTime}`
	}
}

export class Usage {
	/** @type {number} */
	inputTokens
	/** @type {number} */
	reasoningTokens
	/** @type {number} */
	outputTokens
	/** @type {number} */
	cachedInputTokens
	/** @type {Partial<Limits>} */
	limits
	/** @type {Timing} */
	timing
	/** @param {Partial<Usage>} [input] */
	constructor(input = {}) {
		const {
			inputTokens = 0,
			reasoningTokens = 0,
			outputTokens = 0,
			cachedInputTokens = 0,
			limits = new Limits(),
			timing = new Timing(),
		} = input
		this.inputTokens = Number(inputTokens)
		this.reasoningTokens = Number(reasoningTokens)
		this.outputTokens = Number(outputTokens)
		this.cachedInputTokens = Number(cachedInputTokens)
		this.limits = new Limits(limits)
		this.timing = new Timing(timing)
	}
	/** @returns {number} */
	get totalTokens() {
		return this.inputTokens + this.reasoningTokens + this.outputTokens
	}
}
