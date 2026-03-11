import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../../../../../')

describe('Release v1.0.1 - Refactoring & Architecture', () => {
	it('moved domain models to src/domain/', async () => {
		const models = ['AI.js', 'ModelInfo.js', 'ModelProvider.js', 'Pricing.js']
		for (const model of models) {
			const exists = fs.existsSync(path.join(rootDir, 'src/domain', model))
			assert.ok(exists, `${model} should exist in src/domain/`)
			
			const oldExists = fs.existsSync(path.join(rootDir, 'src', model))
			assert.equal(oldExists, false, `${model} should NOT exist in src/ anymore`)
		}
	})

	it('removed unused yaml utilities', () => {
		const yamlExists = fs.existsSync(path.join(rootDir, 'src/utils/yaml.js'))
		assert.equal(yamlExists, false, 'yaml.js should be removed')
	})

	it('ModelProvider implements validateApiKey and Model-as-Schema ui', async () => {
		const { ModelProvider } = await import('../../../../../../src/domain/ModelProvider.js')
		assert.equal(typeof ModelProvider.validateApiKey, 'function', 'validateApiKey should be defined')
		assert.ok(ModelProvider.ui, 'ModelProvider should have static ui for errors')
	})

	it('package.json uses correct test glob', () => {
		const pkgPath = path.join(rootDir, 'package.json')
		const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
		assert.equal(pkg.scripts.test, "node --test --test-timeout=3333 'src/**/*.test.js'", 'Test script should use src/**/*.test.js glob')
	})
	
	it('contains Data-Driven Docs structure', () => {
		assert.ok(fs.existsSync(path.join(rootDir, 'project.md')), 'project.md should exist')
		assert.ok(fs.existsSync(path.join(rootDir, 'docs')), 'docs directory should exist')
	})
})
