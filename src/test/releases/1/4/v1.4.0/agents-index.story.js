import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { runGenerator } from '@nan0web/ui'
import DB from '@nan0web/db'
import { IndexWorkspaceApp } from '../../../../../domain/IndexWorkspaceApp.js'

describe('IndexWorkspaceApp Agents Indexing', () => {
	it('successfully builds the agents index from DB in-memory', async () => {
		const db = new DB({
			predefined: [
				['nan0web_store.csv', [{ name: '@nan0web/ui', path: 'packages/ui' }, { name: '@nan0web/ai', path: 'packages/ai' }]],
				['packages/ui/nan0web.nan0', '- id: "ui-agent"\n  description: "Agent for UI"\n  workflows:\n    - src/agents/workflows/ui.md\n'],
				['packages/ai/nan0web.nan0', '- id: "ai-agent"\n  description: "Agent for AI"\n  inspectors:\n    - src/agents/inspectors/ai.md\n']
			]
		})
		await db.connect()

		const app = new IndexWorkspaceApp({ agents: true }, { db, storeDb: db })
		
		const events = []
		await runGenerator(/** @type {any} */ (app.run()), {
			show: (i) => events.push(`show:${i.message}`),
			progress: (i) => events.push(`progress:${i.message}`),
			ask: async (i) => ({ value: null }),
			result: (i) => { events.push(`result:${i ? JSON.stringify(i.data) : ''}`) }
		})
		
		// Validate that the JSON file was created
		let resultDoc = await db.loadDocument('nan0web_agents.index.nan0', null)
		if (typeof resultDoc === 'string') resultDoc = JSON.parse(resultDoc)
		
		assert.ok(resultDoc, 'nan0web_agents.index.nan0 should be created')
		assert.equal(resultDoc.total, 2)
		const uiAgent = resultDoc.agents.find(a => a.id === 'ui-agent')
		const aiAgent = resultDoc.agents.find(a => a.id === 'ai-agent')
		
		assert.ok(uiAgent, 'ui-agent not found')
		assert.equal(uiAgent.workflows[0], 'src/agents/workflows/ui.md')
		
		assert.ok(aiAgent, 'ai-agent not found')
		assert.equal(aiAgent.inspectors[0], 'src/agents/inspectors/ai.md')
	})
})
