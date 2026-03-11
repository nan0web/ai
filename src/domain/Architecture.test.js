import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Architecture } from './Architecture.js'

describe('Architecture', () => {
	it('creates with defaults', () => {
		const arch = new Architecture()
		assert.deepStrictEqual(arch.input_modalities, [])
		assert.strictEqual(arch.instruct_type, '')
		assert.strictEqual(arch.modality, '')
		assert.deepStrictEqual(arch.output_modalities, [])
		assert.strictEqual(arch.tokenizer, '')
	})

	it('sets values from input', () => {
		const input = {
			input_modalities: ['text'],
			modality: 'text',
			output_modalities: ['text'],
			tokenizer: 'llama',
		}
		const arch = new Architecture(input)
		assert.deepStrictEqual(arch.input_modalities, ['text'])
		assert.strictEqual(arch.modality, 'text')
		assert.deepStrictEqual(arch.output_modalities, ['text'])
		assert.strictEqual(arch.tokenizer, 'llama')
		assert.strictEqual(arch.instruct_type, '') // default
	})

	it('handles invalid arrays', () => {
		const input = {
			input_modalities: 'not-an-array',
		}
		// @ts-ignore invalid arrayss
		const arch = new Architecture(input)
		assert.deepStrictEqual(arch.input_modalities, [])
	})
})
