/**
 * Limits — represents rate limits for AI requests and tokens.
 * Inherits from Model to follow the universal Model-as-Schema pattern.
 * Supports provider-specific aliases for mapping during instantiation.
 */
export class Limits extends Model {
    static rpd: {
        help: string;
        default: number;
        alias: string;
    };
    static rph: {
        help: string;
        default: number;
        alias: string;
    };
    static rpm: {
        help: string;
        default: number;
        alias: string;
    };
    static tpd: {
        help: string;
        default: number;
        alias: string;
    };
    static tph: {
        help: string;
        default: number;
        alias: string;
    };
    static tpm: {
        help: string;
        default: number;
        alias: string;
    };
    /**
     * @param {Partial<Limits> | Record<string, any>} [data] Initial state with optional aliased headers
     * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
     */
    constructor(data?: Partial<Limits> | Record<string, any>, options?: Partial<import("@nan0web/types").ModelOptions>);
    rpd: number | undefined;
    rph: number | undefined;
    rpm: number | undefined;
    tpd: number | undefined;
    tph: number | undefined;
    tpm: number | undefined;
    /** @returns {boolean} */
    get empty(): boolean;
}
import { Model } from '@nan0web/types';
