import { ModelInfo } from '../domain/ModelInfo.js'
import { Pricing } from '../domain/Pricing.js'
import { Architecture } from '../domain/Architecture.js'

function getModels() {
	/** @type {Array<[string, {context_length: number}]>} */
	const models = [
		['gemini-2.0-flash-exp', { context_length: 1_048_576 }],
		['gemini-1.5-flash', { context_length: 1_048_576 }],
		['gemini-1.5-pro', { context_length: 2_097_152 }],
		['gemini-1.0-pro', { context_length: 32_768 }],
	]
	return { models }
}

function makeFlat(models = []) {
	const predefined = getModels()
	const map = new Map(predefined.models)
	const result = []

	// Start with predefined if models is empty
	const ids = new Set(models.map((m) => m.id))
	const combined = [...models]
	for (const [id, opts] of predefined.models) {
		if (!ids.has(id)) combined.push({ id, ...opts })
	}

	for (const model of combined) {
		const pre = map.get(model.id)
		result.push(
			new ModelInfo({
				id: model.id,
				provider: 'google',
				context_length: model.context_length ?? pre?.context_length ?? 128_000,
				pricing: new Pricing({ prompt: 0, completion: 0 }), // Most flash models are free for exp
				architecture: new Architecture({ input_modalities: ['text'], output_modalities: ['text'] }),
			}),
		)
	}
	return result
}

export default { getModels, makeFlat }
