import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ModelInfo } from './ModelInfo.js'
import { Pricing } from './Pricing.js'
import { Architecture } from './Architecture.js'
import { TopProvider } from './TopProvider.js'

describe('ModelInfo', () => {
	it('creates with defaults', () => {
		const model = new ModelInfo()
		assert.strictEqual(model.id, '')
		assert(model.architecture instanceof Architecture)
		assert.strictEqual(model.canonical_slug, '')
		assert.strictEqual(model.context_length, 0)
		assert.strictEqual(model.created, 0)
		assert.deepStrictEqual(model.default_parameters, {})
		assert.strictEqual(model.description, '')
		assert.strictEqual(model.hugging_face_id, '')
		assert.strictEqual(model.name, '')
		assert.strictEqual(model.per_request_limit, 0)
		assert(model.pricing instanceof Pricing)
		assert.deepStrictEqual(model.supported_parameters, [])
		assert.strictEqual(model.provider, '')
		assert(model.top_provider instanceof TopProvider)
	})

	it('sets values from input', () => {
		const input = {
			id: 'test-model',
			name: 'Test Model',
			context_length: 4096,
			pricing: new Pricing({ prompt: 0.1, completion: 0.2 }),
			architecture: new Architecture({ modality: 'text', input_modalities: ['text'] }),
			provider: 'openai',
		}
		const model = new ModelInfo(input)
		assert.strictEqual(model.id, 'test-model')
		assert.strictEqual(model.name, 'Test Model')
		assert.strictEqual(model.context_length, 4096)
		assert.strictEqual(model.pricing.prompt, 0.1)
		assert.strictEqual(model.pricing.completion, 0.2)
		assert.strictEqual(model.architecture.modality, 'text')
		assert.deepStrictEqual(model.architecture.input_modalities, ['text'])
		assert.strictEqual(model.provider, 'openai')
	})

	it('handles nested objects', () => {
		const input = {
			pricing: new Pricing({ prompt: 0.05 }),
			architecture: new Architecture({ modality: 'multi' }),
			top_provider: new TopProvider({ context_length: 8192, is_moderated: true }),
			supported_parameters: ['temperature', 'top_p'],
			default_parameters: { temperature: 0.7 },
			canonical_slug: 'test-slug',
			created: 1234567890,
			description: 'Test description',
			hugging_face_id: 'hf/test-model',
			per_request_limit: 100,
		}
		const model = new ModelInfo(input)
		assert.strictEqual(model.pricing.prompt, 0.05)
		assert.strictEqual(model.pricing.completion, 0) // default for pricing
		assert.strictEqual(model.architecture.modality, 'multi')
		assert.strictEqual(model.top_provider.context_length, 8192)
		assert.strictEqual(model.top_provider.is_moderated, true)
		assert.strictEqual(model.top_provider.max_completion_tokens, -1) // default
		assert.deepStrictEqual(model.supported_parameters, ['temperature', 'top_p'])
		assert.deepStrictEqual(model.default_parameters, { temperature: 0.7 })
		assert.strictEqual(model.canonical_slug, 'test-slug')
		assert.strictEqual(model.created, 1234567890)
		assert.strictEqual(model.description, 'Test description')
		assert.strictEqual(model.hugging_face_id, 'hf/test-model')
		assert.strictEqual(model.per_request_limit, 100)
	})

	it('copies arrays and objects shallowly', () => {
		const input = {
			supported_parameters: ['temp'],
			default_parameters: { temp: 0.7 },
		}
		const model1 = new ModelInfo(input)
		const model2 = new ModelInfo(input)

		// Modifications don't affect each other
		model1.supported_parameters.push('top_p')
		model1.default_parameters.max_tokens = 100

		assert.strictEqual(model1.supported_parameters.length, 2)
		assert.strictEqual(model2.supported_parameters.length, 1)
		assert.strictEqual(model1.default_parameters.max_tokens, 100)
		assert.strictEqual(model2.default_parameters.max_tokens, undefined)
	})
})
