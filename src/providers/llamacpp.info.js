import { ModelInfo } from '../ModelInfo.js'
import { Pricing } from '../Pricing.js'
import { Architecture } from '../Architecture.js'

/**
 * Configuration for local llama.cpp models.
 * Pricing and context length can be customized based on hardware.
 */
const LLAMACPP_MODELS = [
	{
		id: 'llama-3-8b-instruct',
		name: 'Llama 3 8B Instruct',
		context_length: 8192,
		pricing: { prompt: 0, completion: 0 },
		architecture: {
			input_modalities: ['text'],
			output_modalities: ['text'],
			tokenizer: 'llama',
			modality: 'text',
		},
	},
	{
		id: 'nan0web',
		name: 'Fine-tuned @nan0web coder',
		context_length: 32768,
		pricing: { prompt: 0, completion: 0 },
		architecture: {
			input_modalities: ['text'],
			output_modalities: ['text'],
			tokenizer: 'llama',
			modality: 'text',
		},
	},
]

/**
 * Generate ModelInfo instances for local llama.cpp models
 * @param {object[]} [customModels=[]] Additional custom models
 * @returns {ModelInfo[]}
 */
function makeFlat(customModels = []) {
	const models = [...LLAMACPP_MODELS, ...customModels]
	return models.map(
		(m) =>
			new ModelInfo({
				...m,
				provider: 'llamacpp',
				supports_tools: false,
				supports_structured_output: true,
				architecture: new Architecture(m.architecture),
				pricing: new Pricing(m.pricing || { prompt: 0, completion: 0 }),
			}),
	)
}

export default {
	makeFlat,
	models: LLAMACPP_MODELS,
}
