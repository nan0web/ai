import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { DocsParser, DatasetParser } from '@nan0web/test'
import FS from '@nan0web/db-fs'
import { AI } from './domain/AI.js'
import { TestAI } from './domain/TestAI.js'
import { ModelInfo } from './domain/ModelInfo.js'
import { Usage } from './domain/Usage.js'

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
	 * ## Architecture
	 *
	 * ```
	 * @nan0web/ai
	 * ├── AI.js              — Provider abstraction (streamText, generateText)
	 * ├── ModelInfo.js       — Model metadata & capabilities
	 * ├── ModelProvider.js   — Remote model discovery
	 * ├── AiStrategy         — Smart model selection (finance/speed/volume/level)
	 * ├── TestAI.js          — Deterministic testing mock
	 * ├── Usage.js           — Token tracking & cost calculation
	 * └── Pricing.js         — Per-token pricing calculations
	 * ```
	 */
	it('How to verify the package engine requirement?', () => {
		assert.ok(pkg.engines?.node, 'engines.node should be defined')
	})

	/**
	 * @docs
	 * ## Documentation
	 *
	 * - [PLAN.md](./PLAN.md) — Detailed architecture and API plan
	 *
	 * ## License
	 */
	it('How to check the license?', () => {
		assert.equal(pkg.license, 'ISC')
	})
}

describe('README.md testing', testRender)

describe('Rendering README.md', async () => {
	const format = new Intl.NumberFormat('en-US').format
	const source = await fs.loadDocument('src/README.md.js', '')
	const parser = new DocsParser()
	const text = String(parser.decode(source))
	await fs.saveDocument('README.md', text)

	const dataset = DatasetParser.parse(text, pkg.name)
	await fs.saveDocument('.datasets/README.dataset.jsonl', dataset)

	it(`document is rendered in README.md [${format(Buffer.byteLength(text))}b]`, () => {
		assert.ok(text.includes('## License'))
		assert.ok(text.includes('@nan0web/ai'))
	})
})
