/**
 * ModelInfo — represents technical and commercial metadata for an AI model.
 * Inherits from Model to conform to Model-as-Schema v2.
 */
export class ModelInfo extends Model {
    static id: {
        help: string;
        default: string;
    };
    static architecture: {
        help: string;
        default: {};
    };
    static canonical_slug: {
        help: string;
        default: string;
    };
    static context_length: {
        help: string;
        default: number;
    };
    static maximum_output: {
        help: string;
        default: number;
    };
    static limits: {
        help: string;
        default: {};
    };
    static created: {
        help: string;
        default: number;
    };
    static default_parameters: {
        help: string;
        default: {};
    };
    static description: {
        help: string;
        default: string;
    };
    static hugging_face_id: {
        help: string;
        default: string;
    };
    static name: {
        help: string;
        default: string;
    };
    static per_request_limit: {
        help: string;
        default: number;
    };
    static pricing: {
        help: string;
        default: {};
    };
    /** @type {{ help: string, default: string[] }} */
    static supported_parameters: {
        help: string;
        default: string[];
    };
    static provider: {
        help: string;
        default: string;
    };
    static top_provider: {
        help: string;
        default: {};
    };
    static supports_tools: {
        help: string;
        default: boolean;
    };
    static supports_structured_output: {
        help: string;
        default: boolean;
    };
    static status: {
        help: string;
        options: string[];
        default: string;
    };
    static is_moderated: {
        help: string;
        default: boolean;
    };
    /**
     * @param {Record<string, any> & { volume?: number }} [data] Initial state with optional volume
     * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
     */
    constructor(data?: Record<string, any> & {
        volume?: number;
    }, options?: Partial<import("@nan0web/types").ModelOptions>);
    /** @type {string} Unique model string ID */ id: string;
    /** @type {string} Hosting provider name */ provider: string;
    /** @type {number} Max input window tokens */ context_length: number;
    /** @type {number} Max completion tokens */ maximum_output: number;
    /** @type {number} Request token cap */ per_request_limit: number;
    /** @type {number} Model publish timestamp */ created: number;
    /** @type {string} Product display name */ name: string;
    /** @type {string} URL-friendly identifier */ canonical_slug: string;
    /** @type {string} Marketing/Tech description */ description: string;
    /** @type {string} HF repository reference */ hugging_face_id: string;
    /** @type {boolean} Tool-calling capability */ supports_tools: boolean;
    /** @type {boolean} Schema validation support */ supports_structured_output: boolean;
    /** @type {boolean} Provider-level filtering */ is_moderated: boolean;
    /** @type {string} Lifecycle status */ status: string;
    /** @type {string[]} Allowed model params */
    supported_parameters: string[];
    /** @type {Record<string, any>} Default generation params */
    default_parameters: Record<string, any>;
    /** @type {Architecture} Architecture component */ architecture: Architecture;
    /** @type {Pricing} Commercial metrics */ pricing: Pricing;
    /** @type {TopProvider} Org/Owner metadata */ top_provider: TopProvider;
    /** @type {Limits} Active rate limits */ limits: Limits;
    _volume: number | undefined;
    /** @param {number} v */
    set volume(v: number);
    /** @returns {number} The volume of parameters inside model */
    get volume(): number;
}
import { Model } from '@nan0web/types';
import { Architecture } from './Architecture.js';
import { Pricing } from './Pricing.js';
import { TopProvider } from './TopProvider.js';
import { Limits } from './Limits.js';
