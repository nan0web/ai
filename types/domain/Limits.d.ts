export class Limits {
    /** @type {Partial<Limits>} [input] */
    constructor(input?: {});
    /** @type {number} - Requests per day */
    rpd: number;
    /** @type {number} - Requests per hour */
    rph: number;
    /** @type {number} - Requests per minute */
    rpm: number;
    /** @type {number} - Tokens per day */
    tpd: number;
    /** @type {number} - Tokens per hour */
    tph: number;
    /** @type {number} - Tokens per minute */
    tpm: number;
}
