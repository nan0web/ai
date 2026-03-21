import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AI } from './AI.js'

describe('computeModelScore — Multiplicative Matrix', () => {
	it('returns 0 for paid model when strategy.finance = free', () => {
		const ai = new AI({
			models: [{ id: 'test', provider: 'openai', pricing: { prompt: 0.5, completion: 0.5 }, context_length: 8000 }],
			strategy: new AI.Strategy({ finance: 'free' }),
		})
		const model = ai.getModels()[0]
		assert.equal(ai.computeModelScore(model, 100), 0)
	})

	it('returns > 0 for free model when strategy.finance = free', () => {
		const ai = new AI({
			models: [{ id: 'test:free', provider: 'openrouter', pricing: { prompt: 0, completion: 0 }, context_length: 128000 }],
			strategy: new AI.Strategy({ finance: 'free' }),
		})
		const model = ai.getModels()[0]
		assert.ok(ai.computeModelScore(model, 100) > 0, 'Free model must score > 0')
	})

	it('small model (27B) scores higher with volume=low', () => {
		const models = [
			{ id: 'small-27b', provider: 'test', pricing: { prompt: 0, completion: 0 }, context_length: 128000, volume: 27e9 },
			{ id: 'big-235b', provider: 'test', pricing: { prompt: 0, completion: 0 }, context_length: 128000, volume: 235e9 },
		]
		const ai = new AI({
			models,
			strategy: new AI.Strategy({ finance: 'free', volume: 'low' }),
		})
		const [small, big] = ai.getModels()
		assert.ok(ai.computeModelScore(small, 100) > ai.computeModelScore(big, 100))
	})

	it('big model (235B) scores higher with volume=high', () => {
		const models = [
			{ id: 'small-27b', provider: 'test', pricing: { prompt: 0, completion: 0 }, context_length: 128000, volume: 27e9 },
			{ id: 'big-235b', provider: 'test', pricing: { prompt: 0, completion: 0 }, context_length: 128000, volume: 235e9 },
		]
		const ai = new AI({
			models,
			strategy: new AI.Strategy({ finance: 'free', volume: 'high' }),
		})
		const [small, big] = ai.getModels()
		assert.ok(ai.computeModelScore(big, 100) > ai.computeModelScore(small, 100))
	})

	it('buildFallbackQueue respects scoring order', () => {
		const models = [
			{ id: 'fast-small', provider: 'cerebras', pricing: { prompt: 0, completion: 0 }, context_length: 65000, volume: 8e9 },
			{ id: 'slow-big', provider: 'openrouter', pricing: { prompt: 0, completion: 0 }, context_length: 128000, volume: 235e9 },
		]
		const ai = new AI({
			models,
			strategy: new AI.Strategy({ finance: 'free', speed: 'fast', volume: 'low' }),
		})
		const queue = ai.buildFallbackQueue(1000)
		assert.equal(queue[0].id, 'fast-small', 'Faster + smaller model should be first')
	})

	it('model with insufficient context gets score = 0', () => {
		const ai = new AI({
			models: [{ id: 'tiny', provider: 'test', pricing: { prompt: 0, completion: 0 }, context_length: 2000 }],
			strategy: new AI.Strategy({ finance: 'free' }),
		})
		const model = ai.getModels()[0]
		assert.equal(ai.computeModelScore(model, 5000), 0, 'Must be filtered out')
	})

	it('speed=fast bonus for model with high speed T/s', () => {
		const models = [
			{ id: 'fast-model', provider: 'cerebras', pricing: { prompt: 0, completion: 0, speed: 150 }, context_length: 128000, volume: 8e9 },
			{ id: 'slow-model', provider: 'openrouter', pricing: { prompt: 0, completion: 0, speed: 10 }, context_length: 128000, volume: 8e9 },
		]
		const ai = new AI({
			models,
			strategy: new AI.Strategy({ finance: 'free', speed: 'fast' }),
		})
		const [fast, slow] = ai.getModels()
		assert.ok(ai.computeModelScore(fast, 100) > ai.computeModelScore(slow, 100), 'Faster T/s model should score higher')
	})

	it('context fit gives bonus for 3x headroom', () => {
		const models = [
			{ id: 'short-ctx', provider: 'test', pricing: { prompt: 0, completion: 0 }, context_length: 8000, volume: 27e9 },
			{ id: 'long-ctx', provider: 'test', pricing: { prompt: 0, completion: 0 }, context_length: 128000, volume: 27e9 },
		]
		const ai = new AI({
			models,
			strategy: new AI.Strategy({ finance: 'free' }),
		})
		const [short, long] = ai.getModels()
		// 5000 tokens: short-ctx ratio = 8000/6000 ≈ 1.33 → 1.0; long-ctx ratio = 128000/6000 ≈ 21 → 1.3
		assert.ok(ai.computeModelScore(long, 5000) > ai.computeModelScore(short, 5000), 'Model with large context headroom gets bonus')
	})

	it('eaukraine.eu scenario: free strategy does NOT filter :free models', () => {
		const models = [
			{ id: 'qwen-3-235b-a22b', provider: 'cerebras', pricing: { prompt: 0, completion: 0 }, context_length: 128000, volume: 235e9 },
			{ id: 'google/gemma-3-27b-it:free', provider: 'openrouter', pricing: { prompt: 0, completion: 0 }, context_length: 128000, volume: 27e9 },
			{ id: 'mistralai/mistral-small-3.1-24b-instruct:free', provider: 'openrouter', pricing: { prompt: 0, completion: 0 }, context_length: 128000, volume: 24e9 },
		]
		const ai = new AI({
			models,
			strategy: new AI.Strategy({ finance: 'free', speed: 'fast', volume: 'mid' }),
		})
		const queue = ai.buildFallbackQueue(1000)
		assert.ok(queue.length >= 3, `Expected >= 3 candidates, got ${queue.length}`)
		for (const m of queue) {
			assert.ok(ai.computeModelScore(m, 1000) > 0, `${m.id} should have score > 0`)
		}
	})
})
