/**
 * Represents model architecture information.
 */
export class Architecture {
    /**
     * @param {Partial<Architecture>} input
     */
    constructor(input?: Partial<Architecture>);
    /** @type {string[]} - Input modalities supported by the model */
    input_modalities: string[];
    /** @type {string} - Instruct type */
    instruct_type: string;
    /** @type {string} - Model modality */
    modality: string;
    /** @type {string[]} - Output modalities supported by the model */
    output_modalities: string[];
    /** @type {string} - Tokenizer type */
    tokenizer: string;
    /** @type {number} */
    context_length: number;
}
