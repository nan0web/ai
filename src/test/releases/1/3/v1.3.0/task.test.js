import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { VectorDB } from '../../../../../domain/VectorDB.js'
import { Embedder } from '../../../../../domain/Embedder.js'
import { ModelError, Model } from '@nan0web/types'

describe('Release v1.3.0 - Model-as-Schema v2 & Contextual ModelError', () => {
	it('VectorDB: compliance with Model-as-Schema v2', () => {
		const db = new VectorDB({ dim: 512 })
		assert.ok(db instanceof Model, 'VectorDB should extend Model')
		assert.equal(db.dim, 512, 'Constructor should accept data')
		assert.ok(db._, 'Infrastructure options should be isolated in this._')
	})

	it('VectorDB: throws ModelError with $-parameters on dim mismatch', () => {
		const db = new VectorDB({ dim: 1024 })
		try {
			// Deliberately providing vector with 2 elements for 1024-dim DB
			db.addVector([0, 1])
			assert.fail('Should have thrown ModelError')
		} catch (err) {
			assert.ok(err instanceof ModelError, 'Error should be an instance of ModelError')
			assert.ok(err.fields.vector, 'Error should contain "vector" field failure')
			assert.equal(err.fields.$actual, 2, 'Should contain $actual metadata')
			assert.equal(err.fields.$expected, 1024, 'Should contain $expected metadata')
		}
	})

	it('Embedder: compliance with Model-as-Schema v2', () => {
		const emb = new Embedder({ baseURL: 'http://test-api/v1' })
		assert.ok(emb instanceof Model, 'Embedder should extend Model')
		assert.equal(emb.baseURL, 'http://test-api/v1', 'Constructor should handle data')
		assert.equal(typeof emb.embed, 'function', 'Should have embed method')
	})

	it('Embedder: throws ModelError on fetch failure', async () => {
		// Mock fetch that fails
		const mockFetch = async () => ({
			ok: false,
			status: 500,
			statusText: 'Internal Error',
			// @ts-ignore
			text: async () => 'Custom error message',
		})

		const emb = new Embedder({ baseURL: 'http://test-api/v1', fetch: mockFetch })

		try {
			await emb.embed('test')
			assert.fail('Should have thrown ModelError')
		} catch (err) {
			assert.ok(err instanceof ModelError, 'Error should be ModelError instance')
			assert.ok(err.fields.api, 'Error should contain "api" field failure')
			assert.equal(err.fields.$status, 500, 'Should contain $status metadata')
			assert.equal(err.fields.$statusText, 'Internal Error', 'Should contain $statusText metadata')
			assert.equal(
				err.fields.$details,
				'Custom error message',
				'Should contain $details metadata',
			)
		}
	})

	it('Infrastructure Isolation: uses this._.db', async () => {
		let callCount = 0
		const mockDb = {
			save: async (path, data) => {
				callCount++
			},
		}
		const vec = new VectorDB({ dim: 2 }, { db: mockDb })
		vec.addVector([1, 0])
		// Use a temporary path for the index file
		await vec.save('dummy.index')
		assert.equal(callCount, 1, 'Should use injected db for saving metadata')
		try {
			fs.unlinkSync('dummy.index')
		} catch (e) {}
	})
})
