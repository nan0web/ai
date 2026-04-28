import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
import { parseBoundaries } from '../../../../../agents/BoundaryParser.js'
import { AgentOrchestrator } from '../../../../../agents/AgentOrchestrator.js'
import { CnaiRefactorAgent } from '../../../../../agents/CnaiRefactorAgent.js'
import { AiAppModel } from '../../../../../domain/AiAppModel.js'
import { SysBuildAgent } from '../../../../../agents/SysBuildAgent.js'

describe('Release v1.4.0 - Agent Orchestrator & Zero-Hallucination Search', () => {
	it('BoundaryParser: parses file properly', () => {
		const raw = `
---boundary:src/Button.js---
export const Button = () => 'hi'
---boundary---
`
		const files = parseBoundaries(raw)
		assert.equal(files['src/Button.js'], "export const Button = () => 'hi'")
	})

	it('AgentOrchestrator: resolves known sys:build agent', async () => {
		const orch = new AgentOrchestrator({
			intent: { task: 'sys:build', context: { dir: './tmp' } },
		})

		const gen = orch.run()
		let result
		for await (const step of gen) {
			if (step.type === 'result') result = step
		}

		// Currently sys:build attempts to run npm run build in ./tmp.
		// We just ensure it executed the right agent.
		assert.ok(result, 'Orchestrator should return a result from the underlying agent')
		assert.ok(result.data.logs, 'Result should contain terminal logs from SysBuildAgent')
	})

	it('AgentOrchestrator: fails gracefully on unknown agent', async () => {
		const orch = new AgentOrchestrator({
			intent: { task: 'unknown:magic', context: {} },
		})

		const gen = orch.run()
		let result
		for await (const step of gen) {
			if (step.type === 'result') result = step
		}

		assert.equal(result.data.success, false)
		assert.match(result.data.message, /unknown/i, 'Should report unknown task')
	})

	it('CnaiRefactorAgent: generates LLM prompt and parses boundaries', async () => {
		let promptSentToAi = ''
		const dummyAi = {
			generateText: async (model, messages) => {
				promptSentToAi = messages[0].content
				return {
					text: `
---boundary:Fix.js---
fixed content
---boundary---`,
				}
			},
		}

		const agent = new CnaiRefactorAgent(
			{ files: { 'Old.js': 'old content' }, instructions: 'Be better' },
			{ ai: dummyAi },
		)

		const gen = agent.run()
		let result
		for await (const step of gen) {
			if (step.type === 'result') result = step
		}

		assert.ok(promptSentToAi.includes('Old.js'), 'Prompt should include files')
		assert.ok(promptSentToAi.includes('Be better'), 'Prompt should include instructions')
		assert.equal(result.data.success, true)
		assert.equal(result.data.files['Fix.js'], 'fixed content')
	})

	it('AiAppModel: Phase 1 & Phase 2 Zero-Hallucination Search', async () => {
		const { VectorDB } = await import('../../../../../domain/VectorDB.js')
		const vdbTemp = new VectorDB({ dim: 1024 })
		const tempIndex = path.join(os.tmpdir(), 'nan0web-temp-index.bin')
		await vdbTemp.save(tempIndex)

		const mockCSV = `name,workspace,path,tags,version,description\n@nan0web/test,packages,packages/test,,1.0.0,Test pkg`

		const mockDb = {
			get: async (uri) => {
				if (uri === 'nan0web_store.csv') return mockCSV
				if (uri.endsWith('.meta.json')) {
					// Read the meta file we just saved
					const fs = await import('node:fs/promises')
					return JSON.parse(await fs.readFile(tempIndex + '.meta.json', 'utf8'))
				}
				return null
			},
			statDocument: async (uri) => {
				if (uri.endsWith('.bin') || uri.endsWith('.meta.json')) return { exists: true }
				return { exists: false }
			},
			getAbsolutePath: (uri) => {
				if (uri.endsWith('.bin')) return tempIndex
				return uri
			},
		}

		const ai = new AiAppModel({}, { db: mockDb })
		const results = await ai.internalSearch(new Array(1024).fill(0), { k: 5, maxDistance: 0.5 })

		assert.ok(Array.isArray(results), 'Should return results array')

		// Cleanup
		const fs = await import('node:fs/promises')
		await fs.unlink(tempIndex).catch(() => {})
		await fs.unlink(tempIndex + '.meta.json').catch(() => {})
	})
})
