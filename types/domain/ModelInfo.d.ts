/**
 * @typedef {'live'|'staging'} ProviderStatus
 */
/**
 * Represents information about a model.
 */
export class ModelInfo {
    /**
     * Constructs a ModelInfo instance.
     * @param {Partial<ModelInfo> & { volume?: number }} input - Partial object with model properties.
     */
    constructor(input?: Partial<ModelInfo> & {
        volume?: number;
    });
    /** @type {string} - Model ID */
    id: string;
    /** @type {Architecture} - Model architecture */
    architecture: Architecture;
    /** @type {string} */
    canonical_slug: string;
    /** @type {number} - Maximum context length in tokens */
    context_length: number;
    /** @type {number} - Maximum output in tokens */
    maximum_output: number;
    /** @type {Limits} - limits of requests and tokens per time */
    limits: Limits;
    /** @type {number} */
    created: number;
    /** @type {object} */
    default_parameters: object;
    /** @type {string} */
    description: string;
    /** @type {string} */
    hugging_face_id: string;
    /** @type {string} */
    name: string;
    /** @type {number} */
    per_request_limit: number;
    /** @type {Pricing} */
    pricing: Pricing;
    /** @type {string[]} - Supported parameters */
    supported_parameters: string[];
    /** @type {string} - Provider name (openai, cerebras, huggingface/cerebras) */
    provider: string;
    /** @type {TopProvider} */
    top_provider: TopProvider;
    /** @type {boolean} */
    supports_tools: boolean;
    /** @type {boolean} */
    supports_structured_output: boolean;
    /** @type {ProviderStatus} */
    status: ProviderStatus;
    /** @type {boolean} */
    is_moderated: boolean;
    /** @returns {number} The volume of parameters inside model */
    get volume(): number;
    #private;
}
export type ProviderStatus = "live" | "staging";
import { Architecture } from './Architecture.js';
import { Limits } from './Limits.js';
import { Pricing } from './Pricing.js';
import { TopProvider } from './TopProvider.js';
