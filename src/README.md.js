import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { DocsParser, DatasetParser } from '@nan0web/test'
import FS from '@nan0web/db-fs'
import { AI } from './domain/AI.js'
import { TestAI } from './domain/TestAI.js'
import { ModelInfo } from './domain/ModelInfo.js'
import { Usage } from './domain/Usage.js'

import { AgentOrchestrator } from './agents/AgentOrchestrator.js'
import { CnaiRefactorAgent } from './agents/CnaiRefactorAgent.js'
import { parseBoundaries } from './agents/BoundaryParser.js'

const fs = new FS()
let pkg

before(async () => {
	pkg = await fs.loadDocument('package.json', {})
})

// Core test suite that also serves as the source for README generation.
// @docs block comments are extracted to build the final README.md.
function testRender() {
	/**
	 * @docs
	 * # @nan0web/ai
	 *
	 * > Unified AI Kernel — LLM provider abstraction for nan•web ecosystem
	 *
	 * <!-- %PACKAGE_STATUS% -->
	 *
	 * ## Installation
	 */
	it('How to install with npm?', () => {
		/**
		 * ```bash
		 * npm install @nan0web/ai
		 * ```
		 */
		assert.equal(pkg.name, '@nan0web/ai')
	})
	/**
	 * @docs
	 */
	it('How to install with pnpm?', () => {
		/**
		 * ```bash
		 * pnpm add @nan0web/ai
		 * ```
		 */
		assert.equal(pkg.name, '@nan0web/ai')
	})

	/**
	 * @docs
	 * ## Quick Start
	 */
	it('How to create an AI instance?', () => {
		//import { AI } from '@nan0web/ai'
		const ai = new AI()
		assert.ok(ai)
	})

	/**
	 * @docs
	 *
	 * ### Streaming Text
	 *
	 * ```javascript
	 * import { AI } from '@nan0web/ai'
	 *
	 * const ai = new AI()
	 * await ai.refreshModels()
	 *
	 * const model = ai.findModel('llama-3.3')
	 * const stream = ai.streamText(model, [
	 *   { role: 'user', content: 'Hello!' }
	 * ])
	 *
	 * for await (const chunk of stream.textStream) {
	 *   process.stdout.write(chunk)
	 * }
	 * ```
	 */
	it('How to use streamText API?', () => {
		assert.equal(typeof AI.prototype.streamText, 'function')
	})

	/**
	 * @docs
	 * ## Providers
	 *
	 * | Provider | ENV Key | Status |
	 * |----------|---------|--------|
	 * | Cerebras | `CEREBRAS_API_KEY` | ✅ |
	 * | OpenAI | `OPENAI_API_KEY` | ✅ |
	 * | OpenRouter | `OPENROUTER_API_KEY` | ✅ |
	 * | HuggingFace | `HF_TOKEN` | ✅ |
	 * | LlamaCpp | `LLAMA_CPP_URL` | ✅ |
	 */
	it('How to get a provider?', () => {
		//import { AI } from '@nan0web/ai'
		const ai = new AI()
		assert.equal(typeof ai.getProvider, 'function')
	})

	/**
	 * @docs
	 * ## Model Strategy
	 *
	 * Smart model selection by 4 axes:
	 *
	 * - `finance` — `free` | `cheap` | `expensive`
	 * - `speed` — `slow` | `fast`
	 * - `volume` — `low` | `mid` | `high`
	 * - `level` — `simple` | `smart` | `expert`
	 */
	it('How to use AI Strategy for model selection?', () => {
		//import { AI } from '@nan0web/ai'
		const ai = new AI()
		ai.addModel(
			'test',
			new ModelInfo({
				id: 'test-model',
				provider: 'openai',
				context_length: 128000,
				volume: 200e9,
				pricing: { prompt: 1, completion: 1 },
			}),
		)
		const found = ai.strategy.findModel(ai.getModelsMap(), 1000)
		assert.ok(found)
		assert.equal(found.id, 'test-model')
	})

	/**
	 * @docs
	 * ## Model Info
	 */
	it('How to create a ModelInfo instance?', () => {
		//import { ModelInfo } from '@nan0web/ai'
		const model = new ModelInfo({
			id: 'llama-3.3-70b',
			provider: 'cerebras',
			context_length: 128000,
			maximum_output: 8192,
			pricing: { prompt: 0.6, completion: 0.6 },
			volume: 70e9,
		})
		assert.equal(model.id, 'llama-3.3-70b')
		assert.equal(model.provider, 'cerebras')
		assert.equal(model.context_length, 128000)
	})

	/**
	 * @docs
	 * ## Usage Tracking
	 */
	it('How to track token usage?', () => {
		//import { Usage } from '@nan0web/ai'
		const usage = new Usage({
			inputTokens: 1000,
			outputTokens: 500,
		})
		assert.equal(usage.inputTokens, 1000)
		assert.equal(usage.outputTokens, 500)
		assert.equal(usage.totalTokens, 1500)
	})

	/**
	 * @docs
	 * ## Testing
	 *
	 * Use `TestAI` for deterministic tests without real API calls:
	 */
	it('How to use TestAI for testing?', () => {
		//import { TestAI } from '@nan0web/ai/test'
		const ai = new TestAI()
		assert.ok(ai, 'TestAI should be instantiable')
	})

	/**
	 * @docs
	 * ## Agent Orchestration (v1.4.0)
	 *
	 * High-level task orchestration via specialized agents.
	 *
	 * ### AgentOrchestrator
	 */
	it('How to use AgentOrchestrator?', async () => {
		//import { AgentOrchestrator } from '@nan0web/ai'
		const orch = new AgentOrchestrator({
			intent: { task: 'sys:build', context: { dir: '.' } },
		})
		assert.ok(typeof orch.run === 'function')
	})

	/**
	 * @docs
	 * ### CnaiRefactorAgent
	 *
	 * Specialized agent for code refactoring with boundary-aware communication.
	 */
	it('How to use CnaiRefactorAgent?', () => {
		//import { CnaiRefactorAgent } from '@nan0web/ai'
		const agent = new CnaiRefactorAgent({
			files: { 'index.js': 'console.log("hello")' },
			instructions: 'Change output to "world"',
		})
		assert.equal(agent.instructions, 'Change output to "world"')
	})

	/**
	 * @docs
	 * ### BoundaryParser
	 *
	 * Utility for parsing OLMUI boundary markers from multiline responses.
	 */
	it('How to parse boundaries?', () => {
		//import { parseBoundaries } from '@nan0web/ai'
		const raw = '---boundary:src/app.js---\nconsole.log(1)\n---boundary---'
		const files = parseBoundaries(raw)
		assert.equal(files['src/app.js'], 'console.log(1)')
	})

	/**
	 * @docs
	 * ## MCP Server
	 *
	 * Expose semantic search tools as a Model Context Protocol (MCP) server.
	 */
	it('How to install MCP server?', () => {
		//nan0ai mcp install
		assert.ok(pkg.bin.nan0ai)
	})

	/**
	 * @docs
	 * ## CLI: Index & Search
	 *
	 * `@nan0web/ai` provides powerful CLI commands for vector database management and semantic search across the monorepo.
	 *
	 * ### `nan0ai index`
	 *
	 * Creates or updates the vector database cache using embeddings (e.g. OpenAI or Cerebras). By default, it indexes the `docs` scope (Markdown documentation).
	 */
	it('How to index documentation or source code?', () => {
		/**
		 * ```bash
		 * # Index documentation for all projects
		 * nan0ai index
		 *
		 * # Index Source codes (.d.ts files) for all projects
		 * nan0ai index --scope source
		 *
		 * # Force re-index a specific project (ignores cache)
		 * nan0ai index --force -p my-project
		 * ```
		 */
		assert.ok(pkg.bin.nan0ai)
	})

	/**
	 * @docs
	 * #### Indexing Private Repositories
	 * To index private or 3rd-party repositories (like commercial apps) that are not tracked in the global `nan0web_store.csv`, you can create a `nan0web_store.local.csv` file in the workspace root.
	 * The indexer will automatically pick this up and index your private apps. You can safely add `.local.csv` to `.gitignore`.
	 */
	it('How to add private repositories to the search index?', () => {
		/**
		 * Format for `nan0web_store.local.csv`:
		 * ```csv
		 * name,workspace,path,tags,version,description
		 * @my-private/app,apps,apps/3rdparty/my-private/app,,1.0.0,My Private App
		 * ```
		 */
		assert.ok(pkg.bin.nan0ai)
	})

	/**
	 * @docs
	 * ### `nan0ai search`
	 *
	 * Search the vector database semantically.
	 */
	it('How to search the vector database?', () => {
		/**
		 * ```bash
		 * nan0ai search "how to setup auth"
		 *
		 * # Search within Source code ONLY, with strict text matching
		 * nan0ai search "class User" --scope source --strict
		 * ```
		 */
		assert.ok(pkg.bin.nan0ai)
	})

	/**
	 * @docs
	 * ## Architecture
	 *
	 * ```
	 * @nan0web/ai
	 * ├── domain/             — Core business logic
	 * │   ├── AI.js           — Unified provider kernel
	 * │   ├── AiStrategy.js   — Scoring & fallback logic
	 * │   ├── VectorDB.js     — HNSWLib persistence
	 * │   └── Embedder.js     — Text-to-Vector transformations
	 * └── agents/             — High-level task delegates
	 *     ├── AgentOrchestrator.js — Dynamic task delegation
	 *     ├── CnaiRefactorAgent.js — Refactoring intelligence
	 *     └── BoundaryParser.js    — Protocol parsing
	 * ```
	 */
	it('How to verify the package engine requirement?', () => {
		assert.ok(pkg.engines?.node, 'engines.node should be defined')
	})

	/**
	 * @docs
	 * ## Contributing
	 */
	it('How to participate? – [see CONTRIBUTING.md]($pkgURL/blob/main/CONTRIBUTING.md)', async () => {
		/** @docs */
		let text = await fs.loadDocument('CONTRIBUTING.md')
		if (text && typeof text === 'object' && text.content) text = text.content
		assert.ok(String(text).includes('# Contributing'))
	})

	/**
	 * @docs
	 * ## License
	 */
	it('ISC LICENSE – [see full text]($pkgURL/blob/main/LICENSE)', async () => {
		/** @docs */
		const text = await fs.loadDocument('LICENSE')
		assert.ok(String(text).includes('ISC'))
	})
}

describe('README.md testing', testRender)

describe('Rendering README.md', async () => {
	const format = new Intl.NumberFormat('en-US').format
	const source = await fs.loadDocument('src/README.md.js', '')
	const parser = new DocsParser()
	const text = String(parser.decode(source))
	await fs.saveDocument('docs/en/README.md', text)

	const dataset = DatasetParser.parse(text, pkg.name)
	await fs.saveDocument('.datasets/README.dataset.jsonl', dataset)

	it(`document is rendered in docs/en/README.md [${format(Buffer.byteLength(text))}b]`, () => {
		assert.ok(text.includes('## License'))
		assert.ok(text.includes('@nan0web/ai'))
	})
})
