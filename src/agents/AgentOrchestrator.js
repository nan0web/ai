import { Model } from '@nan0web/types'
import { result } from '@nan0web/ui'
import { SysBuildAgent } from './SysBuildAgent.js'
import { CnaiRefactorAgent } from './CnaiRefactorAgent.js'

/**
 * AgentOrchestrator — manages and executes subagents based on intent.
 */
export class AgentOrchestrator extends Model {
	static agents = {
		[SysBuildAgent.alias]: SysBuildAgent,
		'cnai:refactor': CnaiRefactorAgent,
	}

	static intent = { help: 'Intent object with task and context', default: {} }

	/**
	 * @param {Object} [data] Initial state
	 * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {any} Intent object with task and context */ this.intent = this.intent || {}
	}

	/**
	 * Executes the requested agent task.
	 * @returns {AsyncGenerator<any, any, any>}
	 */
	async *run() {
		const task = this.intent?.task
		const Agent = AgentOrchestrator.agents[task]

		if (!Agent) {
			return yield result({
				success: false,
				message: `Unknown task: ${task}`,
			})
		}

		const agent = new Agent(this.intent.context, this._)
		yield* agent.run()
	}
}
