import { Model } from '@nan0web/types'
import { result, progress } from '@nan0web/ui'
import { parseBoundaries } from './BoundaryParser.js'

/**
 * CnaiRefactorAgent — performs code refactoring using LLM and OLMUI boundaries.
 */
export class CnaiRefactorAgent extends Model {
	static alias = 'cnai:refactor'

	static files = { help: 'Files to refactor', default: {} }
	static instructions = { help: 'Instructions for refactoring', default: '' }

	/**
	 * @param {Object} [data] Initial state
	 * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {Record<string, string>} Files to refactor */ this.files = this.files || {}
		/** @type {string} Instructions for refactoring */ this.instructions = String(
			this.instructions || '',
		)
	}

	/**
	 * Runs the refactoring task.
	 * @returns {AsyncGenerator<any, any, any>}
	 */
	async *run() {
		yield progress('Preparing refactoring prompt...')

		const prompt = this.toPrompt()
		const ai = this._['ai']

		if (!ai) {
			return yield result({
				success: false,
				message: 'AI provider is required in options',
			})
		}

		yield progress('Requesting AI refactor...')
		const { text } = await ai.generateText('default', [{ role: 'user', content: prompt }])

		yield progress('Parsing AI response...')
		try {
			const files = parseBoundaries(text)
			yield result({
				success: true,
				files,
			})
		} catch (/** @type {any} */ err) {
			yield result({
				success: false,
				message: `Parsing failed: ${err.message}`,
			})
		}
	}

	/**
	 * Builds the system-style prompt for the LLM.
	 * @returns {string}
	 */
	toPrompt() {
		let prompt = `Instructions: ${this.instructions}\n\nFiles:\n`
		for (const [name, content] of Object.entries(this.files || {})) {
			prompt += `\n--- file: ${name} ---\n${content}\n`
		}
		prompt += '\n\nReturn changed files using OLMUI boundaries: ---boundary:filename---'
		return prompt
	}
}
