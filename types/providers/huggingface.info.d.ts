declare namespace _default {
    export { getModels };
    export { makeFlat };
}
export default _default;
export type HuggingFaceArchitecture = {
    /**
     * - List of input modalities (e.g., ["text"], ["text","image"])
     */
    input_modalities: string[];
    /**
     * - List of output modalities (e.g., ["text"])
     */
    output_modalities: string[];
};
export type HuggingFacePricing = {
    /**
     * - Price per input token (or unit) in USD
     */
    input: number;
    /**
     * - Price per output token (or unit) in USD
     */
    output: number;
};
export type HuggingFaceProviderInfo = {
    /**
     * - Provider identifier (e.g., "novita", "zai-org")
     */
    provider: string;
    /**
     * - Provider status (e.g., "live", "staging")
     */
    status: import("../domain/ModelInfo.js").ProviderStatus;
    /**
     * - Maximum context length supported by the provider
     */
    context_length?: number | undefined;
    /**
     * - Pricing details, if available
     */
    pricing?: HuggingFacePricing | undefined;
    /**
     * - Whether the provider supports tool usage
     */
    supports_tools?: boolean | undefined;
    /**
     * - Whether the provider supports structured output
     */
    supports_structured_output?: boolean | undefined;
    /**
     * - True if the provider is the model's author
     */
    is_model_author?: boolean | undefined;
};
export type HuggingFaceModelInfo = {
    /**
     * - Full model identifier (e.g., "zai-org/GLM-4.7")
     */
    id: string;
    /**
     * - Object type, always "model"
     */
    object: string;
    /**
     * - Unix timestamp of creation
     */
    created: number;
    /**
     * - Owner of the model
     */
    owned_by: string;
    /**
     * - Model architecture description
     */
    architecture: HuggingFaceArchitecture;
    /**
     * - Array of provider information objects
     */
    providers: HuggingFaceProviderInfo[];
};
/**
 * @returns {{ models: readonly Array<[string, object]> }}
 */
declare function getModels(): {
    models: readonly Array<[string, object]>;
};
/**
 * @typedef {Object} HuggingFaceArchitecture
 * @property {string[]} input_modalities - List of input modalities (e.g., ["text"], ["text","image"])
 * @property {string[]} output_modalities - List of output modalities (e.g., ["text"])
 */
/**
 * @typedef {Object} HuggingFacePricing
 * @property {number} input - Price per input token (or unit) in USD
 * @property {number} output - Price per output token (or unit) in USD
 */
/**
 * @typedef {Object} HuggingFaceProviderInfo
 * @property {string} provider - Provider identifier (e.g., "novita", "zai-org")
 * @property {import("../domain/ModelInfo.js").ProviderStatus} status - Provider status (e.g., "live", "staging")
 * @property {number} [context_length] - Maximum context length supported by the provider
 * @property {HuggingFacePricing} [pricing] - Pricing details, if available
 * @property {boolean} [supports_tools] - Whether the provider supports tool usage
 * @property {boolean} [supports_structured_output] - Whether the provider supports structured output
 * @property {boolean} [is_model_author] - True if the provider is the model's author
 */
/**
 * @typedef {Object} HuggingFaceModelInfo
 * @property {string} id - Full model identifier (e.g., "zai-org/GLM-4.7")
 * @property {string} object - Object type, always "model"
 * @property {number} created - Unix timestamp of creation
 * @property {string} owned_by - Owner of the model
 * @property {HuggingFaceArchitecture} architecture - Model architecture description
 * @property {HuggingFaceProviderInfo[]} providers - Array of provider information objects
 */
/**
 * @param {HuggingFaceModelInfo[]} models
 * @returns {ModelInfo[]}
 */
declare function makeFlat(models: HuggingFaceModelInfo[]): ModelInfo[];
import { ModelInfo } from '../domain/ModelInfo.js';
