import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { IndexWorkspaceApp } from '../../../../../../src/domain/IndexWorkspaceApp.js'
import { DBFS } from '@nan0web/db-fs'
import os from 'node:os'
import path from 'node:path'

describe('v1.4.2 Release Contract: Fix sealed DB error in IndexWorkspaceApp', () => {
	it('should not throw "Mount registry is sealed" when this._.db is sealed', async () => {
		const workspaceRoot = process.cwd()
		const sealedDb = new DBFS({ root: workspaceRoot })
		sealedDb.seal()

		const app = new IndexWorkspaceApp(
			{ silent: true },
			{ db: sealedDb, workspaceRoot }
		)

		let sealedErrorThrown = false
		try {
			const iterator = app.indexFull()
			for await (const yieldResult of iterator) {
				// We don't want to actually run the full indexing process.
				// By the time it yields anything, storeDb.mount has already executed.
				break
			}
		} catch (err) {
			if (err.message && err.message.includes('Mount registry is sealed')) {
				sealedErrorThrown = true
			} else {
				// Some other error might happen if the db tries to read/write, but we just want to ensure
				// the mount registry sealed error doesn't happen.
				// In this case, we expect the fix to prevent the seal error.
			}
		}

		assert.equal(
			sealedErrorThrown,
			false,
			'IndexWorkspaceApp.indexFull() threw "Mount registry is sealed" error'
		)
	})
})
