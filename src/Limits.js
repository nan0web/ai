export class Limits {
	/** @type {number} - Requests per day */
	rpd
	/** @type {number} - Requests per hour */
	rph
	/** @type {number} - Requests per minute */
	rpm
	/** @type {number} - Tokens per day */
	tpd
	/** @type {number} - Tokens per hour */
	tph
	/** @type {number} - Tokens per minute */
	tpm
	/** @type {Partial<Limits>} [input] */
	constructor(input = {}) {
		const { rpd = 0, rph = 0, rpm = 0, tpd = 0, tph = 0, tpm = 0 } = input
		this.rpd = Number(rpd)
		this.rph = Number(rph)
		this.rpm = Number(rpm)
		this.tpd = Number(tpd)
		this.tph = Number(tph)
		this.tpm = Number(tpm)
	}
}
