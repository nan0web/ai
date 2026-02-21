import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TopProvider } from './TopProvider.js'

describe('TopProvider', () => {
	it('creates with defaults', () => {
		const tp = new TopProvider()
		assert.strictEqual(tp.context_length, -1)
		assert.strictEqual(tp.is_moderated, false)
		assert.strictEqual(tp.max_completion_tokens, -1)
	})

	it('sets values from input', () => {
		const input = {
			context_length: 8192,
			is_moderated: true,
			max_completion_tokens: 4096,
		}
		const tp = new TopProvider(input)
		assert.strictEqual(tp.context_length, 8192)
		assert.strictEqual(tp.is_moderated, true)
		assert.strictEqual(tp.max_completion_tokens, 4096)
	})

	it('handles invalid types', () => {
		const input = {
			context_length: '1000',
			is_moderated: 1,
		}
		// @ts-ignore provokes incorrect types
		const tp = new TopProvider(input)
		assert.strictEqual(tp.context_length, 1000)
		assert.strictEqual(tp.is_moderated, true)
	})
})
