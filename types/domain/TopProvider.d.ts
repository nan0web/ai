/**
 * Represents top provider information for a model.
 */
export class TopProvider {
    /**
     * @param {Partial<TopProvider>} input
     */
    constructor(input?: Partial<TopProvider>);
    /** @type {number} - Context length */
    context_length: number;
    /** @type {boolean} - Whether the model is moderated */
    is_moderated: boolean;
    /** @type {number} - Max completion tokens */
    max_completion_tokens: number;
}
