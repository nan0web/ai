import { describe, it } from 'node:test'
import assert from 'node:assert'
import { IndexCacheModel } from './IndexCacheModel.js'

describe('IndexCacheModel', () => {
	it('Model-as-Schema properties', () => {
		const model = new IndexCacheModel()
		assert.deepStrictEqual(model.entries, {})
	})

	it('getHashes returns empty array by default', () => {
		const model = new IndexCacheModel()
		assert.deepStrictEqual(model.getHashes('unknown.md'), [])
	})

	it('stores and retrieves hashes', () => {
		const model = new IndexCacheModel()
		const filePath = 'docs/guide.md'
		const hashes = ['hash1', 'hash2']

		model.setHashes(filePath, hashes)
		assert.deepStrictEqual(model.getHashes(filePath), hashes)

		// Ensure mutation of original array doesn't affect cache
		hashes.push('hash3')
		assert.deepStrictEqual(model.getHashes(filePath), ['hash1', 'hash2'])
	})

	it('isUnchanged detection', () => {
		const model = new IndexCacheModel()
		const filePath = 'docs/guide.md'

		// initial set
		model.setHashes(filePath, ['a', 'b', 'c'])

		// exact match
		assert.strictEqual(model.isUnchanged(filePath, ['a', 'b', 'c']), true)

		// missing element (content removed)
		assert.strictEqual(model.isUnchanged(filePath, ['a', 'b']), false)

		// added element (content appended)
		assert.strictEqual(model.isUnchanged(filePath, ['a', 'b', 'c', 'd']), false)

		// modified element (content changed)
		assert.strictEqual(model.isUnchanged(filePath, ['a', 'x', 'c']), false)
	})
})
