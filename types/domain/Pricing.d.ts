/**
 * Pricing — represents pricing information for a model.
 * Inherits from Model to follow the universal Model-as-Schema pattern.
 */
export class Pricing extends Model {
    static completion: {
        help: string;
        default: number;
    };
    static image: {
        help: string;
        default: number;
    };
    static input_cache_read: {
        help: string;
        default: number;
    };
    static input_cache_write: {
        help: string;
        default: number;
    };
    static internal_reasoning: {
        help: string;
        default: number;
    };
    static prompt: {
        help: string;
        default: number;
    };
    static request: {
        help: string;
        default: number;
    };
    static web_search: {
        help: string;
        default: number;
    };
    static speed: {
        help: string;
        default: number;
    };
    /**
     * @param {Partial<Pricing> & { input?: number, output?: number } | Record<string, any>} [data] Initial state with optional and legacy aliases
     * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
     */
    constructor(data?: (Partial<Pricing> & {
        input?: number;
        output?: number;
    }) | Record<string, any>, options?: Partial<import("@nan0web/types").ModelOptions>);
    /** @type {number} Completion cost / 1M tokens */ completion: number;
    /** @type {number} Cost per image generated */ image: number;
    /** @type {number} Cache reading cost */ input_cache_read: number;
    /** @type {number} Cache writing cost */ input_cache_write: number;
    /** @type {number} LLM thinking cost */ internal_reasoning: number;
    /** @type {number} Prompt cost / 1M tokens */ prompt: number;
    /** @type {number} Fixed price per API call */ request: number;
    /** @type {number} Tool-call search cost */ web_search: number;
    /** @type {number} Avg speed in tokens/sec */ speed: number;
    /**
     * Returns the Batch discount in %.
     * @returns {[inputDiscount: number, outputDiscount: number]}
     */
    getBatchDiscount(): [inputDiscount: number, outputDiscount: number];
    /**
     * Calculates the usage cost (total price).
     * @param {Usage} usage
     * @param {{ input?: number, reason?: number, output?: number }} [context] reset pricing in the context.
     * @returns {number}
     */
    calc(usage: Usage, context?: {
        input?: number;
        reason?: number;
        output?: number;
    }): number;
}
import { Model } from '@nan0web/types';
import { Usage } from './Usage.js';
