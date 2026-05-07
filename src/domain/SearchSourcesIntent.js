import { ModelAsApp } from '@nan0web/ui-cli'
import { Model } from '@nan0web/types'

/**
 * SearchSourcesIntent — OLMUI Intent for semantic search across workspace indices.
 */
export class SearchSourcesIntent extends ModelAsApp {
	static alias = 'search'
	static UI = {
		title: 'Search Sources',
	}

	static query = {
		help: 'Query text to search for',
		type: 'string',
		required: true,
		positional: true,
	}

	static project = {
		help: 'Filter by project name (substring)',
		type: 'string',
		alias: 'p',
		default: null,
	}

	static limit = {
		help: 'Number of results to return',
		type: 'number',
		alias: 'k',
		default: 10,
	}

	static maxDistance = {
		help: 'Maximum distance threshold (default: 0.18)',
		type: 'number',
		alias: 'd',
		default: 0.18,
	}

	static scope = {
		help: 'Search scope: "docs" (default) or "source".',
		type: 'string',
		alias: 's',
		options: ['docs', 'source'],
		default: 'docs',
	}

	static strictSearch = {
		alias: 'strict',
		help: 'Strict mode: exactly matches the query string in the results',
		type: 'boolean',
		default: false,
	}

	static json = {
		help: 'Output results in JSON format',
		type: 'boolean',
		default: false,
	}

	static sources = {
		help: 'Shortcut for --scope source',
		type: 'boolean',
		default: false,
	}

	/**
	 * @param {Partial<SearchSourcesIntent> | Record<string, any>} [data] Initial state
	 * @param {any} [options] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string} */ this.query
		/** @type {string|null} */ this.project
		/** @type {"docs"|"source"} */ this.scope
		/** @type {number} */ this.limit
		/** @type {number} */ this.maxDistance
		/** @type {boolean} */ this.strictSearch
		/** @type {boolean} */ this.json
	}

	/**
	 * @returns {AsyncGenerator<any, any, any>}
	 */
	async *run() {
		const { show, result, ask } = await import('@nan0web/ui')

		if (this.help) {
			const content = this.generateHelp()
			if (this.raw) {
				yield show(content, 'info', /** @type {any} */ ({ format: 'markdown', raw: true }))
				return
			}
			const title = /** @type {any} */ (this.constructor).UI?.title || 'Help'
			yield ask('help', { content, title: `${title} Help`, hint: 'content-viewer' })
			return
		}

		if (!this.query) {
			yield show('Search query is empty.', 'error')
			return
		}

		const { MarkdownIndexer } = await import('./MarkdownIndexer.js')
		const scopesToSearch = this.scope
			? [this.scope]
			: /** @type {any} */ (this).sources
				? ['source']
				: ['docs', 'source', 'data']
		let allResults = []

		for (const scope of scopesToSearch) {
			const indexer = new MarkdownIndexer({ scope: /** @type {any} */ (scope) }, { ...this._ })
			const results = await indexer.search(this.query, {
				limit: Number(this.limit) || 10,
				strict: this.strictSearch,
				maxDistance: Number(this.maxDistance) || 0.18,
				project: this.project || undefined,
			})
			allResults.push(...results)
		}

		// Combine and sort the results from multiple scopes
		allResults.sort((a, b) => a.score - b.score)
		const results = allResults.slice(0, Number(this.limit) || 10)

		if (results.length === 0) {
			yield show('No relevant documentation found.', 'error')
			return
		}

		if (this.json) {
			yield result(results, true)
		} else {
			const fs = await import('node:fs/promises')
			const path = await import('node:path')
			let md = `────────────────────────────────────────\nResults:\n────────────────────────────────────────\n\n`

			for (const r of results) {
				const filePath = r.file || 'unknown'
				const packageMatch = filePath.match(/^\/(?:packages|apps(?:\/3rdparty\/[^\/]+)?)\/([^\/]+)/)
				const pkg = packageMatch ? packageMatch[1] : filePath === 'unknown' ? 'unknown' : 'root'
				let startLine = /** @type {number|string} */ ('?')
				let endLine = /** @type {number|string} */ ('?')

				try {
					if (r.file) {
						const absPath = path.join(
							/** @type {any} */ (this._).workspaceRoot || process.cwd(),
							r.file,
						)
						const fullText = await fs.readFile(absPath, 'utf8')
						const idx = fullText.indexOf(r.content)
						if (idx !== -1) {
							startLine = fullText.substring(0, idx).split('\n').length
							endLine = /** @type {number} */ (startLine) + r.content.split('\n').length - 1
						}
					}
				} catch (e) {}

				md += `### Package: ${pkg} | File: ${filePath} | Lines: ${startLine}-${endLine}\n`
				md += `**Score:** ${r.score.toFixed(4)}\n\n`
				md += `\`\`\`markdown\n${r.content}\n\`\`\`\n\n`
				md += `────────────────────────────────────────\n`
			}
			yield show(md, 'info', /** @type {any} */ ({ format: 'markdown', raw: true }))
		}
	}
}
