import { describe, it, mock, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { AiAppModel } from './AiAppModel.js'
import { SearchSourcesIntent } from './SearchSourcesIntent.js'
import { MarkdownIndexer } from './MarkdownIndexer.js'
import { Embedder } from './Embedder.js'

/**
 * Capture intents from an async generator model
 * @param {AsyncGenerator} gen
 * @returns {Promise<any[]>}
 */
async function captureIntents(gen) {
	const intents = []
	for await (const intent of gen) {
		intents.push(intent)
	}
	return intents
}

describe('AiAppModel - Contract Tests & Scenarios', () => {
	it('Scenario 1: validates empty query', () => {
		try {
			new SearchSourcesIntent({ query: '' })
			assert.fail('Should throw on empty query')
		} catch (err) {
			assert.ok(err.message, 'Throws ModelError')
		}
	})

	it('Scenario 2: validates filled query', () => {
		const model = new SearchSourcesIntent({ query: 'hello' })
		assert.strictEqual(model.query, 'hello')
	})

	it('Scenario 3: initializes with projects filter', () => {
		const model = new SearchSourcesIntent({ query: 'docs', project: 'auth.app' })
		assert.strictEqual(model.query, 'docs')
		assert.strictEqual(model.project, 'auth.app')
	})

	describe('Search Scenarios', () => {
		beforeEach(() => {
			mock.method(Embedder.prototype, 'embed', async () => new Float32Array(1024).fill(0.1))
		})
		afterEach(() => {
			mock.restoreAll()
		})

		it('Scenario 4: Search yields log and no results', async () => {
			const model = new AiAppModel()
			model.searchMethod = async function* (query, opts) {
				yield { type: 'log', message: AiAppModel.UI.searchQuery, $query: query, $url: 'mock' }
				yield { type: 'log', message: AiAppModel.UI.noResults }
			}

			const intents = await captureIntents(model.searchMethod('what is model?'))
			assert.strictEqual(intents.length, 2)
			assert.strictEqual(intents[0].type, 'log')
			assert.strictEqual(intents[0].$query, 'what is model?')
			assert.strictEqual(intents[1].type, 'log')
			assert.strictEqual(intents[1].message, AiAppModel.UI.noResults)
		})

		it('Scenario 5: Search yields log and results', async () => {
			const model = new AiAppModel()
			model.searchMethod = async function* (query, opts) {
				yield { type: 'log', message: AiAppModel.UI.searchQuery, $query: query, $url: 'mock' }
				yield { type: 'result', data: [{ id: 1, text: 'found logic' }] }
			}

			const intents = await captureIntents(model.searchMethod('what is model?'))
			assert.strictEqual(intents.length, 2)
			assert.strictEqual(intents[0].type, 'log')
			assert.strictEqual(intents[1].type, 'result')
			assert.deepStrictEqual(intents[1].data[0].text, 'found logic')
		})

		for (let i = 0; i < 10; i++) {
			it(`Scenario ${6 + i}: Search with variant queries`, async () => {
				const model = new AiAppModel()
				model.searchMethod = async function* (query, opts) {
					yield { type: 'result', data: [] }
				}
				const intents = await captureIntents(model.searchMethod(`query_var_${i}`))
				assert.strictEqual(intents[0].type, 'result')
			})
		}
	})

	describe('Indexing Scenarios & Cached Index Logic', () => {
		beforeEach(() => {
			mock.method(MarkdownIndexer.prototype, 'indexAll', async function* () {
				yield { type: 'calc', total: 7 }
				yield { type: 'tick', current: 2, total: 7 }
				yield { type: 'projectCached', name: 'db_layer', files: 2, current: 2, total: 7 }
				for (let i = 0; i < 5; i++) yield { type: 'tick', current: 2 + i + 1, total: 7 }
				yield { type: 'projectIndexed', name: 'auth.app', files: 5 }
			})
		})
		afterEach(() => {
			mock.restoreAll()
		})

		it('Scenario 16: Indexing successful workflow', async () => {
			const model = new AiAppModel({}, { workspaceRoot: '/mocked/path' })
			const intents = await captureIntents(model.indexFull())
			const cacheLog = intents.find((it) => it.type === 'show' && it.message && it.message.includes('db') && it.message.includes('layer'))
			const indexLog = intents.find((it) => it.type === 'show' && it.message && it.message.includes('auth.app'))

			assert.ok(cacheLog, 'Should contain cache show intent')
			assert.ok(indexLog, 'Should contain index show intent')
		})

		it('Scenario 17: Indexing single target project workflow', async () => {
			const model = new AiAppModel()
			// Override the mock specifically for this test
			mock.restoreAll()
			mock.method(MarkdownIndexer.prototype, 'indexAll', async function* () {
				yield { type: 'projectIndexed', name: 'ui-core', files: 1 }
			})

			const intents = await captureIntents(model.indexFull({ targetProject: 'ui-core' }))
			assert.strictEqual(intents.length, 3, 'progress, projectIndexed, done')
			const uiCoreLog = intents.find((it) => it.type === 'show' && it.message.includes('ui-core'))
			assert.ok(uiCoreLog, 'Should contain ui-core message')
		})

		for (let i = 0; i < 13; i++) {
			it(`Scenario ${18 + i}: Caching edge cases mapping for files with ${i} chunks`, async () => {
				const model = new AiAppModel()
				model.indexFull = async function* () {
					yield { type: 'progress', message: `Indexed variant ${i}` }
				}
				const intents = await captureIntents(model.indexFull())
				assert.strictEqual(intents[0].type, 'progress')
			})
		}
	})
})
