import { ModelInfo } from '../domain/ModelInfo.js'
import { Pricing } from '../domain/Pricing.js'

/**
 * @param {object[]} models
 * @returns {ModelInfo[]}
 */
function makeFlat(models) {
	return models.map((m) => {
		const pricing = new Pricing({ ...(m?.pricing ?? {}) })
		pricing.completion *= 1e6
		pricing.prompt *= 1e6
		if (pricing.input_cache_read > 0) pricing.input_cache_read *= 1e6
		if (pricing.input_cache_write > 0) pricing.input_cache_write *= 1e6
		const maximum_output = m.top_provider?.max_completion_tokens
		const is_moderated = m.top_provider?.is_moderated
		return new ModelInfo({ ...m, is_moderated, maximum_output, provider: 'openrouter', pricing })
	})
}

export default {
	makeFlat,
}
