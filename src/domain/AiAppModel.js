import { Model, ModelError } from '@nan0web/types'
import { t } from '@nan0web/i18n'
import { MarkdownIndexer } from './MarkdownIndexer.js'
import { Embedder } from './Embedder.js'
import { VectorDB } from './VectorDB.js'

/**
 * AiAppModel — domain model for AI toolkit management (RAG, Indexing, MCP).
 * Follows Model-as-Schema v2 and OLMUI patterns.
 */
export class AiAppModel extends Model {
	static UI = {
		indexingStarted: '🔍 Starting workspace indexing...',
		projectIndexed: '✅ Project [{project}] indexed ({files} files)',
		projectCached: '✅ Project [{project}] skipped (cache matched for {files} files)',
		scanningFiles: 'Scanning files...',
		embeddingChunks: 'Generating vectors...',
		searchQuery: '🔎 Query: "{query}" (Provider: {url})',
		noResults: '📭 No results found for your query.',
		mcpSuccess: '🚀 MCP Server successfully configured for {ide}!',
		error: '❌ Error: {message}',
	}

	static query = {
		help: 'Semantic search query',
		default: '',
		validate: (val) => (val?.length > 0 ? true : 'Query cannot be empty'),
	}

	static project = {
		help: 'Filter by project name (substring)',
		default: null,
	}

	/**
	 * @param {Partial<AiAppModel> | Record<string, any>} [data] Initial state
	 * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string} Semantic search query */ this.query
		/** @type {string|null} Specific project filter */ this.project
	}

	/**
	 * Generator method for indexing (OLMUI Pattern)
	 * @param {Object} opts
	 * @param {string} [opts.targetProject]
	 */
	async *index(opts = {}) {
		const cfg = /** @type {*} */ (this._)
		const indexer = new MarkdownIndexer({
			workspaceRoot: cfg.workspaceRoot,
			targetProject: opts.targetProject,
		})

		yield {
			type: 'progress',
			message: cfg.t(AiAppModel.UI.indexingStarted),
			current: 0,
			total: 100,
		}

		const embedderUrl = cfg.embedderUrl || process.env.EMBEDDER_URL || 'http://localhost:1234/v1'
		const embedder = new Embedder({ baseURL: embedderUrl })

		for await (const it of indexer.indexAll(embedder)) {
			if (it.type === 'calc') {
				yield {
					type: 'progress',
					label: 'Index',
					total: it.total,
					current: 0,
					message: cfg.t(AiAppModel.UI.scanningFiles),
				}
			}
			if (it.type === 'tick') {
				yield {
					type: 'progress',
					label: 'Index',
					total: it.total,
					current: it.current,
					message: cfg.t(AiAppModel.UI.embeddingChunks),
				}
			}
			if (it.type === 'projectCached') {
				yield {
					type: 'log',
					message: cfg.t(AiAppModel.UI.projectCached, { project: it.name, files: it.files }),
					$project: it.name,
				}
				yield {
					type: 'progress',
					label: 'Index',
					total: it.total,
					current: it.current,
					message: cfg.t(AiAppModel.UI.embeddingChunks),
				}
			}
			if (it.type === 'projectIndexed') {
				yield {
					type: 'log',
					message: cfg.t(AiAppModel.UI.projectIndexed, { project: it.name, files: it.files }),
					$project: it.name,
				}
			}
		}
	}

	/**
	 * Generator method for search (OLMUI Pattern)
	 * @param {string} query
	 * @param {Object} opts
	 * @param {number} [opts.k]
	 * @param {number} [opts.maxDistance]
	 * @param {string} [opts.targetProject]
	 */
	async *search(query, opts = {}) {
		const { k = 10, maxDistance = 0.18, targetProject = null } = opts
		const cfg = /** @type {*} */ (this._)
		const embedderUrl = cfg.embedderUrl || 'http://localhost:1234/v1'

		yield {
			type: 'log',
			message: AiAppModel.UI.searchQuery,
			$query: query,
			$url: embedderUrl,
		}

		const embedder = new Embedder({ baseURL: embedderUrl })
		const instructPrefix =
			'Instruct: Retrieve relevant documentation, workflows, and architectural details to assist the software engineer.\nQuery: '
		const vec = /** @type {number[]} */ (await embedder.embed(instructPrefix + query))

		const results = await this.#internalSearch(vec, { k, maxDistance, targetProject })

		if (results.length === 0) {
			yield { type: 'log', message: AiAppModel.UI.noResults }
			return
		}

		yield { type: 'result', data: results }
	}

	/**
	 * @param {number[]} vec
	 * @param {{ k: number, maxDistance: number, targetProject: string | null }} opts
	 * @returns {Promise<any[]>}
	 */
	async #internalSearch(vec, { k, maxDistance, targetProject }) {
		// Placeholder — full implementation in v1.4.0
		return []
	}
}
