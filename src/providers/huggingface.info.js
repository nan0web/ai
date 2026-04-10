import { Architecture } from '../domain/Architecture.js'
import { ModelInfo } from '../domain/ModelInfo.js'
import { Pricing } from '../domain/Pricing.js'

/**
 * @returns {{ models: readonly Array<[string, object]> }}
 */
function getModels() {
	return {
		models: [
			['zai-org/GLM-4.6', { providers: [{ provider: 'cerebras', context_length: 200_000 }] }],
			['openai/gpt-oss-120b', { providers: [{ provider: 'cerebras', context_length: 200_000 }] }],
			['Qwen/Qwen3-32B', { providers: [{ provider: 'cerebras', context_length: 200_000 }] }],
			[
				'Qwen/Qwen3-235B-A22B-Instruct-2507',
				{ providers: [{ provider: 'cerebras', context_length: 200_000 }] },
			],
		],
	}
}

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
 * @property {"live" | "staging"} status - Provider status (e.g., "live", "staging")
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
function makeFlat(models) {
	const predefined = getModels()
	const map = new Map(predefined.models)
	const result = []
	for (const model of models) {
		const pre = map.get(model.id) ?? {}
		if (!(model.providers && Array.isArray(model.providers))) {
			console.warn('Incorrect HuggingFace model (missing providers)')
			continue
		}
		for (const opts of model.providers) {
			const found = (pre.providers ?? []).find((p) => p.provider === opts.provider) ?? {}
			const pro = 'huggingface/' + (opts.provider ?? '')
			if (pro.endsWith('/')) {
				console.warn("Incorrect model's provider: " + pro)
				continue
			}
			result.push(
				new ModelInfo({
					id: model.id,
					created: model.created,
					architecture: new Architecture({
						input_modalities: model.architecture?.input_modalities,
						output_modalities: model.architecture?.output_modalities,
					}),
					context_length: found.context_length ?? opts.context_length,
					pricing: new Pricing({
						prompt: found.pricing?.input ?? opts.pricing?.input ?? 0,
						completion: found.pricing?.output ?? opts.pricing?.output ?? 0,
					}),
					provider: 'huggingface/' + (found.provider ?? opts.provider),
					supports_structured_output:
						found.supports_structured_output ?? opts.supports_structured_output,
					supports_tools: found.supports_structured_output ?? opts.supports_tools,
					status: found.status ?? opts.status,
				}),
			)
		}
	}
	return result
}

export default {
	getModels,
	makeFlat,
}
