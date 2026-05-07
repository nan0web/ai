import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { matchProject } from './projectFilter.js'

describe('matchProject — Smart Project Filter', () => {
	const nameToDir = new Map([
		['@nan0web/ui', 'packages/ui'],
		['@nan0web/ui-cli', 'packages/ui-cli'],
		['@nan0web/ui-core', 'packages/ui-core'],
		['@industrialbank/ui', 'apps/3rdparty/industrialbank/ui'],
	])

	describe('Exact segment match (default)', () => {
		it('"ui" matches "packages/ui"', () => {
			assert.ok(matchProject('packages/ui', 'ui'))
		})

		it('"ui" does NOT match "packages/ui-cli"', () => {
			assert.ok(!matchProject('packages/ui-cli', 'ui'))
		})

		it('"ui" does NOT match "packages/ui-core"', () => {
			assert.ok(!matchProject('packages/ui-core', 'ui'))
		})

		it('"ui-cli" matches "packages/ui-cli"', () => {
			assert.ok(matchProject('packages/ui-cli', 'ui-cli'))
		})

		it('"ui-cli" does NOT match "packages/ui"', () => {
			assert.ok(!matchProject('packages/ui', 'ui-cli'))
		})

		it('"ui" matches "apps/3rdparty/industrialbank/ui" (same last segment)', () => {
			assert.ok(matchProject('apps/3rdparty/industrialbank/ui', 'ui'))
		})
	})

	describe('Glob/wildcard matching', () => {
		it('"ui*" matches "packages/ui"', () => {
			assert.ok(matchProject('packages/ui', 'ui*'))
		})

		it('"ui*" matches "packages/ui-cli"', () => {
			assert.ok(matchProject('packages/ui-cli', 'ui*'))
		})

		it('"ui-*" matches "packages/ui-cli"', () => {
			assert.ok(matchProject('packages/ui-cli', 'ui-*'))
		})

		it('"ui-*" does NOT match "packages/ui" (no dash suffix)', () => {
			assert.ok(!matchProject('packages/ui', 'ui-*'))
		})

		it('"*cli" matches "packages/ui-cli"', () => {
			assert.ok(matchProject('packages/ui-cli', '*cli'))
		})
	})

	describe('@scope/name resolution via store', () => {
		it('"@nan0web/ui" matches "packages/ui"', () => {
			assert.ok(matchProject('packages/ui', '@nan0web/ui', nameToDir))
		})

		it('"@nan0web/ui" does NOT match "apps/.../industrialbank/ui"', () => {
			assert.ok(!matchProject('apps/3rdparty/industrialbank/ui', '@nan0web/ui', nameToDir))
		})

		it('"@industrialbank/ui" matches "apps/.../industrialbank/ui"', () => {
			assert.ok(matchProject('apps/3rdparty/industrialbank/ui', '@industrialbank/ui', nameToDir))
		})

		it('"@industrialbank/ui" does NOT match "packages/ui"', () => {
			assert.ok(!matchProject('packages/ui', '@industrialbank/ui', nameToDir))
		})

		it('"@nan0web/ui-cli" matches "packages/ui-cli"', () => {
			assert.ok(matchProject('packages/ui-cli', '@nan0web/ui-cli', nameToDir))
		})

		it('"@nan0web/unknown" matches nothing', () => {
			assert.ok(!matchProject('packages/ui', '@nan0web/unknown', nameToDir))
		})
	})

	describe('Full path match', () => {
		it('"packages/ui" matches "packages/ui" exactly', () => {
			assert.ok(matchProject('packages/ui', 'packages/ui'))
		})

		it('"packages/ui" does NOT match "packages/ui-cli"', () => {
			assert.ok(!matchProject('packages/ui-cli', 'packages/ui'))
		})

		it('"packages/ui-cli" matches "packages/ui-cli"', () => {
			assert.ok(matchProject('packages/ui-cli', 'packages/ui-cli'))
		})
	})

	describe('Edge cases', () => {
		it('trailing slash is trimmed: "ui/" matches "packages/ui"', () => {
			assert.ok(matchProject('packages/ui', 'ui/'))
		})

		it('case insensitive', () => {
			assert.ok(matchProject('packages/UI-CLI', 'ui-cli'))
			assert.ok(matchProject('packages/ui-cli', 'UI-CLI'))
		})

		it('null filter matches everything', () => {
			assert.ok(matchProject('packages/ui', null))
			assert.ok(matchProject('anything', null))
		})

		it('empty string filter matches everything', () => {
			assert.ok(matchProject('packages/ui', ''))
		})

		it('@scope without store falls back to last segment', () => {
			assert.ok(matchProject('packages/ui', '@nan0web/ui')) // fallback: "ui" === "ui"
			assert.ok(!matchProject('packages/ui-cli', '@nan0web/ui')) // fallback: "ui" !== "ui-cli"
		})
	})
})
