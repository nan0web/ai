import { describe, it, mock, before, after, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'

import { MarkdownIndexer } from '../../../../src/domain/MarkdownIndexer.js'
import { ShowIndexIntent } from '../../../../src/domain/ShowIndexIntent.js'
import { ListIndexIntent } from '../../../../src/domain/ListIndexIntent.js'
import { IndexWorkspaceApp } from '../../../../src/domain/IndexWorkspaceApp.js'
import { AiAppModel } from '../../../../src/domain/AiAppModel.js'
import { Embedder } from '../../../../src/domain/Embedder.js'
import { DBFS } from '@nan0web/db-fs'
import { DB } from '@nan0web/db'

describe('v1.5.0 — Source Code Indexing & Index Listing', () => {

	const db = new DB({
		predefined: [
			// Meta files for ShowIndexIntent
			['.datasets/source-packages__ui-index.bin.meta.json', { dim: 1024, space: 'cosine', entries: new Array(50), nextId: 50 }],
			['.datasets/source-packages__ui-cli-index.bin.meta.json', { dim: 1024, space: 'cosine', entries: new Array(30), nextId: 30 }],
			['.datasets/docs-packages__ui-index.bin.meta.json', { dim: 1024, space: 'cosine', entries: new Array(100), nextId: 100 }],
			['.datasets/docs-packages__ui-cli-index.bin.meta.json', { dim: 1024, space: 'cosine', entries: new Array(20), nextId: 20 }],
			['.datasets/source-packages__core-index.bin.meta.json', { dim: 1024, space: 'cosine', entries: new Array(40), nextId: 40 }],
			['.datasets/docs-packages__core-index.bin.meta.json', { dim: 1024, space: 'cosine', entries: new Array(60), nextId: 60 }],
			// Cache files for ListIndexIntent
			['.datasets/source-packages__ui-index.cache.json', { entries: { '/packages/ui/src/domain/Model.js': ['hash1', 'hash2'], '/packages/ui/src/index.js': ['hash3'] } }],
			['.datasets/source-packages__ui-cli-index.cache.json', { entries: { '/packages/ui-cli/src/domain/App.js': ['hash4', 'hash5', 'hash6'], '/packages/ui-cli/src/index.js': ['hash7'], '/packages/ui/src/domain/Model.js': ['stale1', 'stale2'], '/packages/ui-chat/src/testing/VisualAdapter.js': ['stale3'], '/packages/ui-cli/docs/README.md': ['stale4'] } }],
			['.datasets/docs-packages__ui-index.cache.json', { entries: { '/packages/ui/docs/README.md': ['hash8'] } }],
			['.datasets/source-packages__core-index.cache.json', { entries: { '/packages/core/src/Model.js': ['hash9', 'hash10'] } }],
			// Source files for MarkdownIndexer memory-only testing
			['packages/ui/src/index.js', 'console.log("ui")'],
			['packages/ui/src/domain/Model.js', 'export class Model {}'],
			['packages/ui/src/Component.jsx', 'export const UI = {}'],
			['packages/ui-cli/src/domain/App.js', 'class App {}'],
			['packages/core/src/Model.js', 'export default {}'],
		]
	})

	before(async () => {
		await db.connect()
		// mock.method(DBFS.prototype, 'listDir', async (dir) => {
		// 	const res = await db.listDir(dir)
		// 	return res
		// })
		// mock.method(DBFS.prototype, 'loadDocument', async (path) => {
		// 	const res = await db.loadDocument(path)
		// 	return res
		// })
	})

	// afterEach(() => {
	// 	mock.restoreAll()
	// })

	describe('1. MarkdownIndexer — source scope scans .jsx/.tsx files', () => {

		it('isSource regexp matches .js, .jsx, .ts, .tsx files', async () => {
			const indexer = new MarkdownIndexer({ scope: 'source' })
			const sourceExts = ['.js', '.jsx', '.ts', '.tsx']
			for (const ext of sourceExts) {
				assert.ok(
					/\.(ts|tsx|js|jsx)$/.test(`file${ext}`),
					`Extension ${ext} should be recognized as source`
				)
			}
		})

		it('scanRecursive finds files in virtual src/ directory (Memory-Only)', async () => {
			const indexer = new MarkdownIndexer({ scope: 'source' }, { db })
			const files = await indexer.scanRecursive('packages/ui', 'packages/ui')

			assert.ok(files.length > 0, 'Should find virtual source files')
			const jsFiles = files.filter(f => f.endsWith('.js'))
			assert.ok(jsFiles.length >= 2, 'Should find .js files in virtual src/')
			assert.ok(files.some(f => f.endsWith('.jsx')), 'Should find .jsx file in virtual src/')
		})

		it('scanRecursive recognizes .jsx and .tsx extensions', async () => {
			const isSourceRegexp = /\.(ts|tsx|js|jsx)$/
			assert.ok(isSourceRegexp.test('Component.jsx'), '.jsx should match isSource')
			assert.ok(isSourceRegexp.test('Component.tsx'), '.tsx should match isSource')
		})
	})

	describe('2. ShowIndexIntent — scope filtering with predictable data', () => {

		it('ShowIndexIntent -p ui-cli filters out packages/ui (exact segment)', async () => {
			const intent = new ShowIndexIntent({ project: 'ui-cli', json: true }, { db })
			const events = []
			for await (const ev of intent.run()) {
				events.push(ev)
			}

			mock.restoreAll()

			// Find the result event
			const resultEvent = events.find(e => e.type === 'result')
			assert.ok(resultEvent, 'Should yield a result event')

			const data = resultEvent.data
			// Should include ONLY ui-cli, NOT packages/ui or packages/core
			for (const item of data) {
				assert.ok(
					item.project.includes('ui-cli'),
					`Expected only ui-cli projects, got: ${item.project}`
				)
				assert.ok(
					!item.project.endsWith('/ui'),
					`Should NOT include packages/ui, got: ${item.project}`
				)
			}
		})

		it('ShowIndexIntent -s source filters by scope', async () => {
			const intent = new ShowIndexIntent({ scope: 'source', json: true }, { db })
			const events = []
			for await (const ev of intent.run()) {
				events.push(ev)
			}

			const resultEvent = events.find(e => e.type === 'result')
			assert.ok(resultEvent, 'Should yield a result event')

			const data = resultEvent.data
			for (const item of data) {
				assert.equal(item.scope, 'source', `All results must be source scope, got: ${item.scope}`)
			}
			// Should have 3 source indices (ui, ui-cli, core)
			assert.equal(data.length, 3, 'Should have exactly 3 source indices')
		})

		it('ShowIndexIntent scope options include docs, source, and data', async () => {
			assert.deepEqual(ShowIndexIntent.scope.options, ['docs', 'source', 'data'])
		})
	})

	describe('3. ListIndexIntent — file listing with predictable data', () => {

		it('ListIndexIntent has alias "ls"', async () => {
			assert.equal(ListIndexIntent.alias, 'ls')
		})

		it('ListIndexIntent -p ui-cli -s source shows ONLY ui-cli files', async () => {
			const intent = new ListIndexIntent({ project: 'ui-cli', scope: 'source', json: true }, { db })
			const events = []
			for await (const ev of intent.run()) {
				events.push(ev)
			}

			mock.restoreAll()

			const resultEvent = events.find(e => e.type === 'result')
			assert.ok(resultEvent, 'Should yield a result event')

			const data = resultEvent.data
			assert.equal(data.length, 2, 'Should return exactly 2 files from ui-cli')

			for (const item of data) {
				assert.equal(item.project, 'packages/ui-cli', `All files must be from ui-cli, got: ${item.project}`)
				assert.ok(
					item.file.includes('/ui-cli/'),
					`File path should contain /ui-cli/, got: ${item.file}`
				)
			}
		})

		it('ListIndexIntent -p ui-cli does NOT include packages/ui files', async () => {
			const intent = new ListIndexIntent({ project: 'ui-cli', json: true }, { db })
			const events = []
			for await (const ev of intent.run()) {
				events.push(ev)
			}

			mock.restoreAll()

			const resultEvent = events.find(e => e.type === 'result')
			assert.ok(resultEvent)

			const data = resultEvent.data
			// Must NOT have any packages/ui (without -cli)
			const uiOnly = data.filter(d => d.project === 'packages/ui')
			assert.equal(uiOnly.length, 0, 'Should NOT include packages/ui when filtering by ui-cli')
		})

		it('ListIndexIntent -s source filters out docs scope', async () => {
			const intent = new ListIndexIntent({ scope: 'source', json: true }, { db })
			const events = []
			for await (const ev of intent.run()) {
				events.push(ev)
			}

			mock.restoreAll()

			const resultEvent = events.find(e => e.type === 'result')
			assert.ok(resultEvent)

			const data = resultEvent.data
			for (const item of data) {
				assert.equal(item.scope, 'source', `All results must be source, got: ${item.scope}`)
			}
			// Should have 5 total source files (2 from ui + 2 from ui-cli + 1 from core)
			assert.equal(data.length, 5, 'Should have 5 source files total')
		})

		it('AiAppModel includes ListIndexIntent in commands', async () => {
			assert.ok(
				AiAppModel.command.options.includes(ListIndexIntent),
				'AiAppModel should include ListIndexIntent'
			)
		})
	})

	describe('4. IndexWorkspaceApp — Model-as-Schema UI & _handleEvent', () => {

		it('static UI contains all required i18n keys', async () => {
			const requiredKeys = [
				'done', 'info', 'noProjects', 'projectCached', 'projectIndexed',
				'agentsStart', 'scanning', 'verifyingCache', 'verifyingCacheProject',
				'generatingVectors', 'errorIndexing',
			]
			for (const key of requiredKeys) {
				assert.ok(
					IndexWorkspaceApp.UI[key],
					`UI.${key} must be defined`
				)
				assert.equal(
					typeof IndexWorkspaceApp.UI[key], 'string',
					`UI.${key} must be a string`
				)
			}
		})

		it('static UI keys do NOT contain emoji', async () => {
			const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
			for (const [key, value] of Object.entries(IndexWorkspaceApp.UI)) {
				assert.ok(
					!emojiRegex.test(/** @type {string} */ (value)),
					`UI.${key} must not contain emoji, got: ${value}`
				)
			}
		})

		it('_handleEvent yields error via show() for error events', async () => {
			const app = new IndexWorkspaceApp({})
			const results = []
			const deps = {
				show: (msg, level) => ({ type: 'show', msg, level }),
				progress: () => ({ type: 'progress' }),
				t: (s) => s,
			}
			for (const ev of app._handleEvent({ type: 'error', project: 'test', message: 'fail' }, deps)) {
				results.push(ev)
			}
			assert.equal(results.length, 1)
			assert.equal(results[0].level, 'error')
			assert.ok(results[0].msg.includes('fail'))
		})

		it('_handleEvent yields progress for scanProgress events', async () => {
			const app = new IndexWorkspaceApp({})
			const results = []
			const deps = {
				show: (msg, level) => ({ type: 'show', msg, level }),
				progress: (msg, pct, opts) => ({ type: 'progress', msg, pct, opts }),
				t: (s) => s,
			}
			for (const ev of app._handleEvent({ type: 'scanProgress', project: 'ui', files: 10, current: 5, total: 10 }, deps)) {
				results.push(ev)
			}
			assert.equal(results.length, 1)
			assert.equal(results[0].type, 'progress')
			assert.equal(results[0].pct, 50)
		})

		it('_handleEvent yields projectCached via show() with t()', async () => {
			const app = new IndexWorkspaceApp({})
			const results = []
			const tCalls = []
			const deps = {
				show: (msg, level) => ({ type: 'show', msg, level }),
				progress: () => ({ type: 'progress' }),
				t: (s, params) => { tCalls.push({ s, params }); return s },
			}
			for (const ev of app._handleEvent({ type: 'projectCached', name: 'ui', dir: 'packages/ui' }, deps)) {
				results.push(ev)
			}
			assert.equal(results.length, 1)
			assert.equal(results[0].level, 'info')
			// Verify t() was called with the correct UI key
			assert.ok(tCalls.some(c => c.s === IndexWorkspaceApp.UI.projectCached))
		})

		it('_handleEvent yields projectIndexed via show() with t()', async () => {
			const app = new IndexWorkspaceApp({})
			const results = []
			const tCalls = []
			const deps = {
				show: (msg, level) => ({ type: 'show', msg, level }),
				progress: () => ({ type: 'progress' }),
				t: (s, params) => { tCalls.push({ s, params }); return s },
			}
			for (const ev of app._handleEvent({ type: 'projectIndexed', name: 'ui', files: 42, dir: 'packages/ui' }, deps)) {
				results.push(ev)
			}
			assert.equal(results.length, 1)
			assert.equal(results[0].level, 'success')
			assert.ok(tCalls.some(c => c.s === IndexWorkspaceApp.UI.projectIndexed))
			assert.ok(tCalls.some(c => c.params?.files === 42))
		})

		it('AiAppModel includes IndexWorkspaceApp in commands', async () => {
			assert.ok(
				AiAppModel.command.options.includes(IndexWorkspaceApp),
				'AiAppModel should include IndexWorkspaceApp'
			)
		})
	})
})
