import { Model } from '@nan0web/types'

/**
 * Architecture — represents model architecture and modality information.
 */
export class Architecture extends Model {
	/** @type {{ help: string, default: string[] }} */
	static input_modalities = { help: 'Supported input modalities (e.g. text, image)', default: [] }
	static instruct_type = { help: 'Type of instruct tuning', default: '' }
	static modality = { help: 'Primary model modality', default: '' }
	/** @type {{ help: string, default: string[] }} */
	static output_modalities = { help: 'Supported output modalities', default: [] }
	static tokenizer = { help: 'Tokenizer algorithm', default: '' }
	static context_length = { help: 'Native context length support', default: 0 }

	/**
	 * @param {Record<string, any>} [data] Input data
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string[]} Input modes (text/img) */
		this.input_modalities = Array.isArray(this.input_modalities) ? [...this.input_modalities] : []
		/** @type {string[]} Output modes (text/img) */
		this.output_modalities = Array.isArray(this.output_modalities)
			? [...this.output_modalities]
			: []
		/** @type {string} Type of instruction kit */ this.instruct_type = String(this.instruct_type)
		/** @type {string} Primary model modality */ this.modality = String(this.modality)
		/** @type {string} Tokenizer used by model */ this.tokenizer = String(this.tokenizer)
		/** @type {number} Native context window */ this.context_length = Number(this.context_length)
	}
}
