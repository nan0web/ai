import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SpecRunner } from '@nan0web/ui/testing'
import { StoreApp } from '../../../../../domain/StoreApp.js'

describe('StoreApp Story (SpecRunner)', () => {
	const workspaceRoot = process.cwd()
	const mockData = [
		{ name: '@nan0web/test', workspace: 'packages', path: 'packages/test', tags: '', version: '1.0.0', description: 'Test pkg' }
	]

	const mockDb = {
		loadDocumentAs: async (ext, uri) => {
			if (uri.includes('nan0web_store')) return mockData
			if (uri.includes('package.json')) return { name: '@nan0web/ai', version: '1.4.1' }
			return null
		},
		mount: () => {},
		saveDocument: async () => {},
		statDocument: async () => ({ exists: true }),
		getAbsolutePath: (uri) => uri,
	}

	it('Scenario: Listing projects in Markdown', async () => {
		await SpecRunner.executeFile(import.meta.dirname, 'store.story.nan0', 'list-md', { StoreApp }, { workspaceRoot, db: mockDb })
	})

	it('Scenario: Listing projects in JSON (raw mode)', async () => {
		await SpecRunner.executeFile(import.meta.dirname, 'store.story.nan0', 'list-json', { StoreApp }, { workspaceRoot, db: mockDb })
	})

	it('Scenario: Adding a project', async () => {
		await SpecRunner.executeFile(import.meta.dirname, 'store.story.nan0', 'add-project', { StoreApp }, { workspaceRoot, db: mockDb })
	})
})
