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
})
