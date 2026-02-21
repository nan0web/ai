# @nan0web/ai

> Unified AI Kernel — LLM provider abstraction for nan•web ecosystem

<!-- %PACKAGE_STATUS% -->

## Installation

How to install with npm?
```bash
npm install @nan0web/ai
```

How to install with pnpm?
```bash
pnpm add @nan0web/ai
```

## Quick Start

How to create an AI instance?
```js
import { AI } from '@nan0web/ai'
const ai = new AI()
```

### Streaming Text

```javascript
import { AI } from '@nan0web/ai'

const ai = new AI()
await ai.refreshModels()

const model = ai.findModel('llama-3.3')
const stream = ai.streamText(model, [
  { role: 'user', content: 'Hello!' }
])

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk)
}
```

How to use streamText API?

## Providers

| Provider | ENV Key | Status |
|----------|---------|--------|
| Cerebras | `CEREBRAS_API_KEY` | ✅ |
| OpenAI | `OPENAI_API_KEY` | ✅ |
| OpenRouter | `OPENROUTER_API_KEY` | ✅ |
| HuggingFace | `HF_TOKEN` | ✅ |
| LlamaCpp | `LLAMA_CPP_URL` | ✅ |

How to get a provider?
```js
import { AI } from '@nan0web/ai'
const ai = new AI()
```
## Model Strategy

Smart model selection by 4 axes:

- `finance` — `free` | `cheap` | `expensive`
- `speed` — `slow` | `fast`
- `volume` — `low` | `mid` | `high`
- `level` — `simple` | `smart` | `expert`

How to use AI Strategy for model selection?
```js
import { AI } from '@nan0web/ai'
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
```
## Model Info

How to create a ModelInfo instance?
```js
import { ModelInfo } from '@nan0web/ai'
const model = new ModelInfo({
	id: 'llama-3.3-70b',
	provider: 'cerebras',
	context_length: 128000,
	maximum_output: 8192,
	pricing: { prompt: 0.6, completion: 0.6 },
	volume: 70e9,
})
```
## Usage Tracking

How to track token usage?
```js
import { Usage } from '@nan0web/ai'
const usage = new Usage({
	inputTokens: 1000,
	outputTokens: 500,
})
```
## Testing

Use `TestAI` for deterministic tests without real API calls:

How to use TestAI for testing?
```js
import { TestAI } from '@nan0web/ai/test'
const ai = new TestAI()
```
## Architecture

```
@nan0web/ai
├── AI.js              — Provider abstraction (streamText, generateText)
├── ModelInfo.js       — Model metadata & capabilities
├── ModelProvider.js   — Remote model discovery
├── AiStrategy         — Smart model selection (finance/speed/volume/level)
├── TestAI.js          — Deterministic testing mock
├── Usage.js           — Token tracking & cost calculation
└── Pricing.js         — Per-token pricing calculations
```

How to verify the package engine requirement?

## Documentation

- [PLAN.md](./PLAN.md) — Detailed architecture and API plan

## License

How to check the license?
