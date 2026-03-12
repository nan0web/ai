/**
 * Represents pricing information for a model.
 */
export class Pricing {
    /**
     * @param {Partial<Pricing> & { input?: number, output?: number }} options
     */
    constructor(options?: Partial<Pricing> & {
        input?: number;
        output?: number;
    });
    /** @type {number} - Completion cost per million tokens */
    completion: number;
    /** @type {number} - Image cost */
    image: number;
    /** @type {number} - Input cache read cost */
    input_cache_read: number;
    /** @type {number} - Input cache write cost */
    input_cache_write: number;
    /** @type {number} - Internal reasoning cost */
    internal_reasoning: number;
    /** @type {number} - Prompt cost per million tokens */
    prompt: number;
    /** @type {number} - Request cost */
    request: number;
    /** @type {number} - Web search cost */
    web_search: number;
    /** @type {number} - average speed T/s */
    speed: number;
    /**
     * Returns the Batch discount in %.
     * @returns {[inputDicount: number, outputDiscount: number]}
     */
    getBatchDiscount(): [inputDicount: number, outputDiscount: number];
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
import { Usage } from './Usage.js';
