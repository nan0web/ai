import { Model } from '@nan0web/types'

/**
 * TopProvider — represents provider-specific configuration and constraints.
 */
export class TopProvider extends Model {
	static context_length = { help: 'Provider-specific context length limit', default: -1 }
	static is_moderated = { help: 'Is the model output moderated by this provider?', default: false }
	static max_completion_tokens = { help: 'Maximum tokens allowed for completion', default: -1 }

	/**
	 * @param {Partial<TopProvider>} [data]
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options]
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		this.context_length = Number(this.context_length)
		this.is_moderated = Boolean(this.is_moderated)
		this.max_completion_tokens = Number(this.max_completion_tokens)
	}
}
