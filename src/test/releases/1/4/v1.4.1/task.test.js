import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'
import { VectorDB } from '../../../../../domain/VectorDB.js'

describe('Release v1.4.1 - Stabilization & Resilience', () => {
	it('VectorDB should automatically initialize default DBFS if none provided', () => {
		const vdb = new VectorDB({ dim: 1024 })
		assert.ok(vdb._.db, 'Should have a default DBFS instance')
		// DBFS root defaults to '.' which resolves to CWD in operations
		assert.ok(vdb._.db.root === '.' || vdb._.db.root === process.cwd(), 'Default DBFS root should be . or CWD')
	})

	it('VectorDB.load should use async/promise API (no callback crash)', async () => {
		const vdb = new VectorDB({ dim: 1024 })
		// Loading a non-existent file should return false gracefully via DBFS.statDocument
		const result = await vdb.load('/non/existent/path')
		assert.equal(result, false, 'Should return false for non-existent index')
	})

	it('MCP Server initialization check (smoke test)', async () => {
		const mcpServerPath = path.resolve(process.cwd(), 'bin/mcp-server.js')
		const stat = await fs.stat(mcpServerPath).catch(() => null)
		assert.ok(stat, 'bin/mcp-server.js must exist')
	})
})
