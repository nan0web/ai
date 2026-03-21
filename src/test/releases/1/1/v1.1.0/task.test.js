import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../../../')

describe('Release v1.1.0 - Scoring Matrix & Exports', () => {
	it('exports all necessary models including ProviderConfig', async () => {
		const aiPackage = await import('../../../../../index.js')
		assert.ok(aiPackage.AI, 'AI should be exported')
		assert.ok(aiPackage.ModelProvider, 'ModelProvider should be exported')
		assert.ok(aiPackage.ProviderConfig, 'ProviderConfig should be exported')
		assert.ok(aiPackage.Architecture, 'Architecture should be exported')
	})
	
	it('AI implements scoring logic and fallback queue', async () => {
		const { AI } = await import('../../../../../domain/AI.js')
		const ai = new AI()
		
		assert.equal(typeof ai.computeModelScore, 'function', 'AI must implement computeModelScore')
		assert.equal(typeof ai.buildFallbackQueue, 'function', 'AI must implement buildFallbackQueue')
	})

	it('computeModelScore uses multiplicative matrix (contract)', async () => {
		const { AI } = await import('../../../../../domain/AI.js')

		const ai = new AI({
			models: [
				{ id: 'paid', provider: 'openai', pricing: { prompt: 1, completion: 1 }, context_length: 128000 },
				{ id: 'free-model:free', provider: 'openrouter', pricing: { prompt: 0, completion: 0 }, context_length: 128000 },
			],
			strategy: new AI.Strategy({ finance: 'free' }),
		})
		const [paid, free] = ai.getModels()

		// Paid model MUST be eliminated by finance multiplier = 0
		assert.equal(ai.computeModelScore(paid, 100), 0, 'Paid model must score 0 with finance=free')

		// Free model MUST pass — score is product of multipliers starting from 100
		const freeScore = ai.computeModelScore(free, 100)
		assert.ok(freeScore > 0, `Free model must score > 0, got ${freeScore}`)
		assert.ok(freeScore > 100, `Free model gets 1.5x finance bonus, score must be > 100, got ${freeScore}`)
	})
})
