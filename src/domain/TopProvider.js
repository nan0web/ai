/**
 * Represents top provider information for a model.
 */
export class TopProvider {
	/** @type {number} - Context length */
	context_length = -1
	/** @type {boolean} - Whether the model is moderated */
	is_moderated = false
	/** @type {number} - Max completion tokens */
	max_completion_tokens = -1

	/**
	 * @param {Partial<TopProvider>} input
	 */
	constructor(input = {}) {
		const {
			context_length = this.context_length,
			is_moderated = this.is_moderated,
			max_completion_tokens = this.max_completion_tokens,
		} = input
		this.context_length = Number(context_length)
		this.is_moderated = Boolean(is_moderated)
		this.max_completion_tokens = Number(max_completion_tokens)
	}
}
