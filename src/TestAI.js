/**
 * @typedef {import('ai').StreamTextResult<any, any>} StreamTextResult
 * @typedef {import('ai').ModelMessage} ModelMessage
 */

import { randomUUID } from 'node:crypto'
import { AI } from './AI.js'
import { Usage } from './Usage.js'

/**
 * TestAI extends AI to simulate chat responses without real API calls.
 *
 * Responses can be provided in-memory via the constructor.
 *
 * @example
 * const ai = new TestAI(['Hello!', 'World!'])
 * const result = await ai.streamText(null, [])
 * // result.text === 'Hello!'
 */
export class TestAI extends AI {
	/** @type {string[]} */
	#responses
	/** @type {number} */
	#index = 0

	/**
	 * @param {string[]} [responses] Pre-recorded text responses.
	 */
	constructor(responses = ['test response']) {
		super()
		this.#responses = responses
	}

	// @ts-ignore - Full mock method: ignores type constraints for simulation flexibility
	async streamText(model, messages, options = {}) {
		const { delay = 0 } = options
		const fullResponse = this.#responses[this.#index++ % this.#responses.length] || ''
		const reasoning = ''

		const usage = new Usage({
			inputTokens: Math.round(
				messages.reduce(
					(acc, msg) => acc + (typeof msg.content === 'string' ? msg.content.length / 4 : 0),
					0,
				),
			),
			outputTokens: fullResponse.split(/\s+/).length,
		})

		const chunks = fullResponse.split(/(\s+)/).filter(Boolean)

		const textStream = {
			[Symbol.asyncIterator]: async function* () {
				for (const chunk of chunks) {
					if (delay > 0) await new Promise((r) => setTimeout(r, delay))
					yield chunk
				}
			},
		}

		const now = Date.now()
		return {
			id: randomUUID(),
			text: fullResponse,
			reasoning,
			content: fullResponse,
			reasoningText: reasoning,
			textStream,
			usage,
			rawCall: { messageId: randomUUID() },
			experimental_output: [],
			warnings: [],
			files: [],
			sources: [],
			toolCalls: [],
			toolResults: [],
			finishReason: 'stop',
			stopReason: 'stop',
			response: {
				id: `test-${now}`,
				timestamp: new Date(now),
				modelId: 'test-model',
				headers: {},
				messages: [],
			},
		}
	}

	/**
	 * Non-streaming version.
	 * @param {any} model
	 * @param {ModelMessage[]} messages
	 * @param {object} [options]
	 * @returns {Promise<{text: string, usage: Usage}>}
	 */
	async generateText(model, messages, options = {}) {
		const result = await this.streamText(model, messages, options)
		return { text: result.text, usage: result.usage }
	}
}
