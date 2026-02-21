import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Pricing } from './Pricing.js'

describe('Pricing', () => {
	it('creates with defaults', () => {
		const pricing = new Pricing()
		assert.strictEqual(pricing.completion, 0)
		assert.strictEqual(pricing.prompt, 0)
		assert.strictEqual(pricing.image, 0)
		assert.strictEqual(pricing.input_cache_read, 0)
		assert.strictEqual(pricing.input_cache_write, 0)
		assert.strictEqual(pricing.internal_reasoning, 0)
		assert.strictEqual(pricing.request, 0)
		assert.strictEqual(pricing.web_search, 0)
	})

	it('sets values from input', () => {
		const input = {
			completion: 1.5,
			prompt: 0.8,
			image: 0.2,
		}
		const pricing = new Pricing(input)
		assert.strictEqual(pricing.completion, 1.5)
		assert.strictEqual(pricing.prompt, 0.8)
		assert.strictEqual(pricing.image, 0.2)
		// Others remain defaults
		assert.strictEqual(pricing.input_cache_read, 0)
	})

	it('handles invalid numbers', () => {
		const input = {
			completion: '1.2',
			prompt: null,
		}
		// @ts-ignore handles invalid numbers
		const pricing = new Pricing(input)
		assert.strictEqual(pricing.completion, 1.2)
		assert.strictEqual(pricing.prompt, 0)
	})
})
