export class Limits {
    static rpd: {
        alias: string;
    };
    static rph: {
        alias: string;
    };
    static rpm: {
        alias: string;
    };
    static tpd: {
        alias: string;
    };
    static tph: {
        alias: string;
    };
    static tpm: {
        alias: string;
    };
    /** @param {Partial<Limits>} [input] */
    constructor(input?: Partial<Limits>);
    /** @type {number | undefined} Remaining requests per day */
    rpd: number | undefined;
    /** @type {number | undefined} Remaining requests per hour */
    rph: number | undefined;
    /** @type {number | undefined} Remaining requests per minute */
    rpm: number | undefined;
    /** @type {number | undefined} Remaining tokens per day */
    tpd: number | undefined;
    /** @type {number | undefined} Remaining tokens per hour */
    tph: number | undefined;
    /** @type {number | undefined} Remaining tokens per minute */
    tpm: number | undefined;
    /** @returns {boolean} */
    get empty(): boolean;
}
export class Timing {
    /** @param {Partial<Timing>} [input] */
    constructor(input?: Partial<Timing>);
    /** @type {number} The time in milliseconds when queued */
    queued: number;
    /** @type {number} The time in milliseconds when reading is started in the queue */
    started: number;
    /** @type {number} The time in milliseconds when first chunk returned */
    prompted: number;
    /** @type {number} The time in milliseconds when reasoning is complete */
    understood: number;
    /** @type {number} The time in milliseconds when response is complete */
    completed: number;
    /** @returns {number} The time in milliseconds spent on completion */
    get queueTime(): number;
    /** @returns {number} The time in milliseconds spent on prompt reading */
    get promptTime(): number;
    /** @returns {number} The time in milliseconds spent on reasoning */
    get understoodTime(): number;
    /** @returns {number} The time in milliseconds spent on completion */
    get completionTime(): number;
    /** @returns {number} The time in milliseconds spent on completion and queue */
    get totalTime(): number;
    /** @returns {string} */
    toString(): string;
}
export class Usage {
    /** @param {Partial<Usage>} [input] */
    constructor(input?: Partial<Usage>);
    /** @type {number} */
    inputTokens: number;
    /** @type {number} */
    reasoningTokens: number;
    /** @type {number} */
    outputTokens: number;
    /** @type {number} */
    cachedInputTokens: number;
    /** @type {Partial<Limits>} */
    limits: Partial<Limits>;
    /** @type {Timing} */
    timing: Timing;
    /** @returns {number} */
    get totalTokens(): number;
}
