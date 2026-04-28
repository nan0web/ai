import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { SpecRunner } from '@nan0web/ui/testing'
import { SearchSourcesIntent } from '../../../../../domain/SearchSourcesIntent.js'
import { MarkdownIndexer } from '../../../../../domain/MarkdownIndexer.js'

describe('SearchSourcesIntent Story (SpecRunner)', () => {
	const workspaceRoot = '/mock/root'
	
	it('Scenario: Successful search yielding results', async () => {
		mock.method(MarkdownIndexer.prototype, 'search', async () => {
			return [
				{ file: '/packages/test/README.md', content: 'hello world', score: 0.1 }
			]
		})

		const stream = [
			{ SearchSourcesIntent: { query: 'hello' } },
			{ show: '*' },
			{ result: '*' }
		]

		const runner = new SpecRunner({ stream, registry: { SearchSourcesIntent } }, { workspaceRoot })
		for await (const it of runner.run()) { }
		
		mock.restoreAll()
	})

	it('Scenario: Search with no results', async () => {
		mock.method(MarkdownIndexer.prototype, 'search', async () => [])

		const stream = [
			{ SearchSourcesIntent: { query: 'nothing' } },
			{ show: '*' } // warning about no results
		]

		const runner = new SpecRunner({ stream, registry: { SearchSourcesIntent } }, { workspaceRoot })
		for await (const it of runner.run()) { }
		
		mock.restoreAll()
	})
})
