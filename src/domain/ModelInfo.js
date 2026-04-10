import { Model } from '@nan0web/types'
import { Pricing } from './Pricing.js'
import { Architecture } from './Architecture.js'
import { TopProvider } from './TopProvider.js'
import { Limits } from './Limits.js'

/**
 * ModelInfo — represents technical and commercial metadata for an AI model.
 * Inherits from Model to conform to Model-as-Schema v2.
 */
export class ModelInfo extends Model {
	static id = { help: 'Unique model identifier', default: '' }
	static architecture = { help: 'Model architecture details', default: {} }
	static canonical_slug = { help: 'Canonical slug for identification', default: '' }
	static context_length = { help: 'Maximum context length in tokens', default: 0 }
	static maximum_output = { help: 'Maximum output length in tokens', default: 0 }
	static limits = { help: 'Rate limits (requests/tokens)', default: {} }
	static created = { help: 'Creation timestamp', default: 0 }
	static default_parameters = { help: 'Default model parameters', default: {} }
	static description = { help: 'Brief model description', default: '' }
	static hugging_face_id = { help: 'Corresponding Hugging Face model ID', default: '' }
	static name = { help: 'Human-friendly model name', default: '' }
	static per_request_limit = { help: 'Specific per-request token limit', default: 0 }
	static pricing = { help: 'Model pricing metadata', default: {} }
	/** @type {{ help: string, default: string[] }} */
	static supported_parameters = { help: 'List of supported parameter names', default: [] }
	static provider = { help: 'Provider name (e.g. cerebras, gemini)', default: '' }
	static top_provider = { help: 'Top-level provider metadata', default: {} }
	static supports_tools = { help: 'Does it support tool calling?', default: false }
	static supports_structured_output = {
		help: 'Does it support JSON schema/structured output?',
		default: false,
	}
	static status = { help: 'Deployment status', options: ['live', 'staging'], default: 'staging' }
	static is_moderated = { help: 'Is the output moderated by provider?', default: false }

	/**
	 * @param {Record<string, any> & { volume?: number }} [data] Initial state with optional volume
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string} Unique model string ID */ this.id
		/** @type {string} Hosting provider name */ this.provider
		/** @type {number} Max input window tokens */ this.context_length
		/** @type {number} Max completion tokens */ this.maximum_output
		/** @type {number} Request token cap */ this.per_request_limit
		/** @type {number} Model publish timestamp */ this.created
		/** @type {string} Product display name */ this.name
		/** @type {string} URL-friendly identifier */ this.canonical_slug
		/** @type {string} Marketing/Tech description */ this.description
		/** @type {string} HF repository reference */ this.hugging_face_id
		/** @type {boolean} Tool-calling capability */ this.supports_tools
		/** @type {boolean} Schema validation support */ this.supports_structured_output
		/** @type {boolean} Provider-level filtering */ this.is_moderated
		/** @type {string} Lifecycle status */ this.status
		/** @type {string[]} Allowed model params */
		this.supported_parameters = Array.isArray(this.supported_parameters)
			? [...this.supported_parameters]
			: []
		/** @type {Record<string, any>} Default generation params */
		this.default_parameters =
			this.default_parameters && typeof this.default_parameters === 'object'
				? { .../** @type {*} */ (this.default_parameters) }
				: {}

		/** @type {Architecture} Architecture component */ this.architecture = new Architecture(
			this.architecture,
		)
		/** @type {Pricing} Commercial metrics */ this.pricing = new Pricing(this.pricing)
		/** @type {TopProvider} Org/Owner metadata */ this.top_provider = new TopProvider(
			this.top_provider,
		)
		/** @type {Limits} Active rate limits */ this.limits = new Limits(this.limits)

		// Handle optional volume property
		if (data.volume) this._volume = Number(data.volume)
	}

	/** @returns {number} The volume of parameters inside model */
	get volume() {
		const vol = this._volume || 0
		if (vol > 0) return vol
		const arr = this.id
			.split('-')
			.filter((w) => w.toLowerCase().endsWith('b'))
			.map((w) => w.slice(0, -1))
			.filter((w) => !isNaN(parseInt(w)))
		return 1e9 * Number(arr[0] || 0)
	}

	/** @param {number} v */
	set volume(v) {
		this._volume = Number(v)
	}
}
