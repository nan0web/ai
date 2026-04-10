/**
 * Timing — tracks response timing at various stages.
 */
export class Timing extends Model {
    static queued: {
        help: string;
        default: () => number;
    };
    static started: {
        help: string;
        default: number;
    };
    static prompted: {
        help: string;
        default: number;
    };
    static understood: {
        help: string;
        default: number;
    };
    static completed: {
        help: string;
        default: number;
    };
    /**
     * @param {Partial<Timing> | Record<string, any>} [data] Initial timestamps
     * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
     */
    constructor(data?: Partial<Timing> | Record<string, any>, options?: Partial<import("@nan0web/types").ModelOptions>);
    /** @type {number} Request creation UTC */ queued: number;
    /** @type {number} API fetch call UTC */ started: number;
    /** @type {number} First chunk received UTC */ prompted: number;
    /** @type {number} Logic/Reasoning done UTC */ understood: number;
    /** @type {number} Full response received UTC */ completed: number;
    get queueTime(): number;
    get promptTime(): number;
    get understoodTime(): number;
    get completionTime(): number;
    get totalTime(): number;
}
/**
 * Usage — represents token usage and timing for an AI request.
 */
export class Usage extends Model {
    static inputTokens: {
        help: string;
        default: number;
    };
    static reasoningTokens: {
        help: string;
        default: number;
    };
    static outputTokens: {
        help: string;
        default: number;
    };
    static cachedInputTokens: {
        help: string;
        default: number;
    };
    static limits: {
        help: string;
        default: {};
    };
    static timing: {
        help: string;
        default: {};
    };
    /**
     * @param {Partial<Usage> | Record<string, any>} [data] Initial token counts
     * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
     */
    constructor(data?: Partial<Usage> | Record<string, any>, options?: Partial<import("@nan0web/types").ModelOptions>);
    /** @type {number} Prompt token count */ inputTokens: number;
    /** @type {number} Internal thought tokens */ reasoningTokens: number;
    /** @type {number} Completion token count */ outputTokens: number;
    /** @type {number} Cached tokens used */ cachedInputTokens: number;
    /** @type {Limits} Current rate limit state */ limits: Limits;
    /** @type {Timing} Timing benchmarks */ timing: Timing;
    /**
     * No-op setter to allow Object.assign in Model.js to safely skip or
     * overwrite this derived property during instantiation.
     * @param {any} _v
     */
    set totalTokens(_v: any);
    /** @returns {number} */
    get totalTokens(): number;
}
import { Model } from '@nan0web/types';
import { Limits } from './Limits.js';
