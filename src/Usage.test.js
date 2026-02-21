import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Usage } from './Usage.js'

describe('Usage', () => {
	it('creates with defaults', () => {
		const usage = new Usage()
		assert.strictEqual(usage.inputTokens, 0)
		assert.strictEqual(usage.reasoningTokens, 0)
		assert.strictEqual(usage.outputTokens, 0)
		assert.strictEqual(usage.totalTokens, 0)
	})

	it('sets values from input', () => {
		const input = {
			inputTokens: 100,
			reasoningTokens: 20,
			outputTokens: 50,
			totalTokens: 170,
		}
		const usage = new Usage(input)
		assert.strictEqual(usage.inputTokens, 100)
		assert.strictEqual(usage.reasoningTokens, 20)
		assert.strictEqual(usage.outputTokens, 50)
		assert.strictEqual(usage.totalTokens, 170)
	})

	it('handles invalid numbers', () => {
		const input = {
			inputTokens: '200',
			totalTokens: null,
		}
		// @ts-ignore provokes incorrect types
		const usage = new Usage(input)
		assert.strictEqual(usage.inputTokens, 200)
		assert.strictEqual(usage.totalTokens, 200)
		assert.strictEqual(usage.reasoningTokens, 0)
		assert.strictEqual(usage.outputTokens, 0)
	})
})
