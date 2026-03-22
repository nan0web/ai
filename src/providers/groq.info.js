import { ModelInfo } from '../domain/ModelInfo.js'
import { Pricing } from '../domain/Pricing.js'
import { Architecture } from '../domain/Architecture.js'

function getModels() {
	/** @type {Array<[string, {context_length: number}]>} */
	const models = [
		['llama-3.3-70b-versatile', { context_length: 128_000 }],
		['llama3-70b-8192', { context_length: 8192 }],
		['llama3-8b-8192', { context_length: 8192 }],
		['mixtral-8x7b-32768', { context_length: 32768 }],
		['gemma2-9b-it', { context_length: 8192 }],
		['deepseek-r1-distill-llama-70b', { context_length: 128_000 }],
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
				provider: 'groq',
				context_length: model.context_length ?? pre?.context_length ?? 8192,
				pricing: new Pricing({ prompt: 0, completion: 0 }), // Free tier
				architecture: new Architecture({ input_modalities: ['text'], output_modalities: ['text'] }),
			}),
		)
	}
	return result
}

export default { getModels, makeFlat }
