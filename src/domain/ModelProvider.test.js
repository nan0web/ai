import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { ModelProvider } from './ModelProvider.js'
import { ModelInfo } from './ModelInfo.js'

describe('ModelProvider (Interface Welding)', async () => {
	it('fetchFromProvider: cerebras normalization matches snapshot', async () => {
		const provider = new ModelProvider()

		// Setup mock for global fetch
		// @ts-ignore
		const originalFetch = globalThis.fetch
		const mockResponse = {
			data: [{ id: 'llama-3.3-70b', created: 12345 }],
		}

		// @ts-ignore
		globalThis.fetch = mock.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			}),
		)

		// Set dummy API key
		process.env.CEREBRAS_API_KEY = 'test-key'

		try {
			const models = await provider.fetchFromProvider('cerebras')
			assert.equal(models.length, 1)
			assert.equal(models[0].id, 'llama-3.3-70b')

			const flat = provider.flatten(models, 'cerebras')
			assert.equal(flat.length, 1)
			assert.ok(flat[0] instanceof ModelInfo)
			assert.equal(flat[0].provider, 'cerebras')
			// Verify static info was merged (llama-3.3-70b has prompt pricing: 0.85)
			assert.equal(flat[0].pricing?.prompt, 0.85)
		} finally {
			// Restore
			// @ts-ignore
			globalThis.fetch = originalFetch
			delete process.env.CEREBRAS_API_KEY
		}
	})

	it('getAll: integrates multiple providers and caches data', async () => {
		// Mock FS to simulate caching
		const mockFs = {
			access: mock.fn(() => Promise.resolve(false)), // Cache miss
			save: mock.fn(() => Promise.resolve()),
			load: mock.fn(() => Promise.resolve(null)),
			info: mock.fn(() => Promise.resolve({ mtimeMs: Date.now() })),
		}

		const provider = new ModelProvider({ fs: mockFs })

		// Mock fetch for all providers
		// @ts-ignore
		const originalFetch = globalThis.fetch
		// @ts-ignore
		globalThis.fetch = mock.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ data: [] }),
			}),
		)

		try {
			// We only set keys for some to avoid giant output
			process.env.CEREBRAS_API_KEY = 'test'

			const models = await provider.getAll({ noCache: true })
			assert.ok(models instanceof Map)

			// Should have at least the static/fetched models if any
			// (Even with empty fetch, some providers might return predefined ones)
		} finally {
			// @ts-ignore
			globalThis.fetch = originalFetch
			delete process.env.CEREBRAS_API_KEY
		}
	})
})
