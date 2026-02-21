import { Pricing } from './Pricing.js'
import { Architecture } from './Architecture.js'
import { TopProvider } from './TopProvider.js'
import { Limits } from './Limits.js'

/**
 * @typedef {'live'|'staging'} ProviderStatus
 */

/**
 * Represents information about a model.
 */
export class ModelInfo {
	/** @type {string} - Model ID */
	id = ''
	/** @type {Architecture} - Model architecture */
	architecture = new Architecture()
	/** @type {string} */
	canonical_slug = ''
	/** @type {number} - Maximum context length in tokens */
	context_length = 0
	/** @type {number} - Maximum output in tokens */
	maximum_output = 0
	/** @type {Limits} - limits of requests and tokens per time */
	limits = new Limits()
	/** @type {number} */
	#volume = 0
	/** @type {number} */
	created = 0
	/** @type {object} */
	default_parameters = {}
	/** @type {string} */
	description = ''
	/** @type {string} */
	hugging_face_id = ''
	/** @type {string} */
	name = ''
	/** @type {number} */
	per_request_limit = 0
	/** @type {Pricing} */
	pricing = new Pricing()
	/** @type {string[]} - Supported parameters */
	supported_parameters = []
	/** @type {string} - Provider name (openai, cerebras, huggingface/cerebras) */
	provider = ''
	/** @type {TopProvider} */
	top_provider = new TopProvider()
	/** @type {boolean} */
	supports_tools = false
	/** @type {boolean} */
	supports_structured_output = false
	/** @type {ProviderStatus} */
	status = 'staging'
	/** @type {boolean} */
	is_moderated = false

	/**
	 * Constructs a ModelInfo instance.
	 * @param {Partial<ModelInfo> & { volume?: number }} input - Partial object with model properties.
	 */
	constructor(input = {}) {
		const {
			id = '',
			architecture = {},
			canonical_slug = '',
			context_length = 0,
			maximum_output = 0,
			created = 0,
			default_parameters = {},
			description = '',
			hugging_face_id = '',
			name = '',
			per_request_limit = 0,
			pricing = {},
			supported_parameters = [],
			provider = '',
			top_provider = {},
			limits = {},
			supports_tools = false,
			supports_structured_output = false,
			volume = 0,
			status = this.status,
			is_moderated = false,
		} = input
		this.id = String(id)
		this.architecture = new Architecture(architecture)
		this.canonical_slug = String(canonical_slug)
		this.context_length = Number(context_length)
		this.maximum_output = Number(maximum_output)
		this.created = Number(created)
		this.default_parameters = { ...default_parameters } // Shallow copy to ensure object
		this.description = String(description)
		this.hugging_face_id = String(hugging_face_id)
		this.name = String(name)
		this.per_request_limit = Number(per_request_limit)
		this.pricing = new Pricing(pricing)
		this.supported_parameters = Array.isArray(supported_parameters) ? [...supported_parameters] : []
		this.provider = String(provider)
		this.top_provider = new TopProvider(top_provider)
		this.limits = new Limits(limits)
		this.supports_tools = Boolean(supports_tools)
		this.is_moderated = Boolean(is_moderated)
		this.supports_structured_output = Boolean(supports_structured_output)
		this.status = 'live' === status ? 'live' : 'staging'
		this.#volume = volume
	}

	/** @returns {number} The volume of parameters inside model */
	get volume() {
		if (this.#volume > 0) return this.#volume
		const arr = this.id
			.split('-')
			.filter((w) => w.toLowerCase().endsWith('b'))
			.map((w) => w.slice(0, -1))
			.filter((w) => !isNaN(parseInt(w)))
		return 1e9 * Number(arr[0] || 0)
	}
}
