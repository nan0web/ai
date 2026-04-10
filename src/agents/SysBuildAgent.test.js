import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SysBuildAgent } from './SysBuildAgent.js'
import { Model } from '@nan0web/types'

describe('SysBuildAgent', () => {
	it('complies with Model-as-Schema v2', () => {
		const agent = new SysBuildAgent({ dir: './tmp' })
		assert.ok(agent instanceof Model)
		assert.equal(agent.dir, './tmp')
	})

	it('run generator yields progress line by line', async () => {
		const agent = new SysBuildAgent({ dir: '.' }, { t: (key) => key })

		// Mock spawn
		agent.spawn = () => ({
			stdout: {
				setEncoding: () => {},
				[Symbol.asyncIterator]: async function* () {
					yield 'line 1\nline 2'
					yield '\nline 3'
				},
			},
			stderr: {
				setEncoding: () => {},
				[Symbol.asyncIterator]: async function* () {
					yield 'error line'
				},
			},
			on: (event, cb) => {
				if (event === 'close') setTimeout(() => cb(0), 10)
			},
		})

		const gen = agent.run()
		const items = []
		while (true) {
			const { value, done } = await gen.next()
			if (done) {
				items.push(value)
				break
			}
			items.push(value)
		}

		const progressMessages = items.filter((i) => i.type === 'progress').map((i) => i.message)
		assert.ok(progressMessages.includes('line 1'))
		assert.ok(progressMessages.includes('line 2'))
		assert.ok(progressMessages.includes('line 3'))
		assert.ok(progressMessages.includes('ERR: error line'))

		const result = items.find((i) => i.type === 'result')
		assert.ok(result.data.success)
		assert.ok(result.data.logs.includes('line 1\nline 2\nline 3'))
	})
})
