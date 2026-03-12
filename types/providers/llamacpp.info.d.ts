declare namespace _default {
    export { makeFlat };
    export { LLAMACPP_MODELS as models };
}
export default _default;
/**
 * Generate ModelInfo instances for local llama.cpp models
 * @param {object[]} [customModels=[]] Additional custom models
 * @returns {ModelInfo[]}
 */
declare function makeFlat(customModels?: object[]): ModelInfo[];
/**
 * Configuration for local llama.cpp models.
 * Pricing and context length can be customized based on hardware.
 */
declare const LLAMACPP_MODELS: {
    id: string;
    name: string;
    context_length: number;
    pricing: {
        prompt: number;
        completion: number;
    };
    architecture: {
        input_modalities: string[];
        output_modalities: string[];
        tokenizer: string;
        modality: string;
    };
}[];
import { ModelInfo } from '../domain/ModelInfo.js';
