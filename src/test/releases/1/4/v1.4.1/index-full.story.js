import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { SpecRunner } from '@nan0web/ui/testing'
import { IndexWorkspaceApp } from '../../../../../domain/IndexWorkspaceApp.js'
import { MarkdownIndexer } from '../../../../../domain/MarkdownIndexer.js'

describe('IndexWorkspaceApp Story (SpecRunner)', () => {
	const workspaceRoot = '/mock/root'
	
	const mockDb = {
		loadDocumentAs: async (ext, uri) => {
			if (uri.includes('nan0web_store.csv')) return [{ name: 'ui-core', path: 'packages/ui-core' }]
			if (uri.includes('nan0web_store.local.csv')) return []
			return null
		},
		mount: () => {},
		statDocument: async () => ({ exists: true }),
		getAbsolutePath: (uri) => uri,
	}

	it('Scenario: Full indexing with multiple scopes', async () => {
		mock.method(MarkdownIndexer.prototype, 'indexAll', async function* () {
			yield { type: 'scanProgress', project: 'ui-core', files: 1, current: 1, total: 1 }
			yield { type: 'projectIndexed', name: 'ui-core', files: 1 }
		})

		const stream = [
			{ IndexWorkspaceApp: { silent: false } },
			{ show: '*' }, // Starting...
			{ progress: '*' }, // Scanning (docs)
			{ show: '*' },     // ui-core indexed (docs)
			{ progress: '*' }, // Scanning (source)
			{ show: '*' },     // ui-core indexed (source)
			{ progress: '*' }, // Scanning (data)
			{ show: '*' },     // ui-core indexed (data)
			{ show: '*' }      // Done
		]

		const runner = new SpecRunner({ stream, registry: { IndexWorkspaceApp } }, { workspaceRoot, db: mockDb, storeDb: mockDb })
		
		for await (const it of runner.run()) { }
		
		mock.restoreAll()
	})
})
