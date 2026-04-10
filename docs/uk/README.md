# @nan0web/ai

> Уніфіковане AI ядро — абстракція LLM-провайдерів для екосистеми nan•web

<!-- %PACKAGE_STATUS% -->

## Встановлення

Як встановити за допомогою npm?
```bash
npm install @nan0web/ai
```

Як встановити за допомогою pnpm?
```bash
pnpm add @nan0web/ai
```

## Швидкий старт

Як створити екземпляр AI?
```js
import { AI } from '@nan0web/ai'
const ai = new AI()
```

### Потоковий текст

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

Як використовувати API streamText?

## Провайдери

| Провайдер | ENV Ключ | Статус |
|----------|---------|--------|
| Cerebras | `CEREBRAS_API_KEY` | ✅ |
| OpenAI | `OPENAI_API_KEY` | ✅ |
| OpenRouter | `OPENROUTER_API_KEY` | ✅ |
| HuggingFace | `HF_TOKEN` | ✅ |
| LlamaCpp | `LLAMA_CPP_URL` | ✅ |

Як отримати провайдера?
```js
import { AI } from '@nan0web/ai'
const ai = new AI()
```
## Стратегія

Розумний вибір моделі за 4 осями:

- `finance` — `free` | `cheap` | `expensive`
- `speed` — `slow` | `fast`
- `volume` — `low` | `mid` | `high`
- `level` — `simple` | `smart` | `expert`

Як використовувати AI Strategy для вибору моделі?
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
## Інформація про модель

Як створити екземпляр ModelInfo?
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
## Відстеження використання

Як відстежувати використання токенів?
```js
import { Usage } from '@nan0web/ai'
const usage = new Usage({
	inputTokens: 1000,
	outputTokens: 500,
})
```
## Тестування

Використовуйте `TestAI` для детермінованих тестів без реальних викликів API:

Як використовувати TestAI для тестування?
```js
import { TestAI } from '@nan0web/ai/test'
const ai = new TestAI()
```
## Оркестрація агентів (v1.4.0)

Високорівнева оркестрація завдань через спеціалізовані агенти.

### AgentOrchestrator

Як використовувати AgentOrchestrator?
```js
import { AgentOrchestrator } from '@nan0web/ai'
const orch = new AgentOrchestrator({
	intent: { task: 'sys:build', context: { dir: '.' } },
})
```
### CnaiRefactorAgent

Спеціалізований агент для рефакторингу коду з підтримкою OLMUI Boundaries.

Як використовувати CnaiRefactorAgent?
```js
import { CnaiRefactorAgent } from '@nan0web/ai'
const agent = new CnaiRefactorAgent({
	files: { 'index.js': 'console.log("hello")' },
	instructions: 'Change output to "world"',
})
```
### BoundaryParser

Утиліта для парсингу OLMUI Boundaries з багаторядкових відповідей.

Як парсити boundaries?
```js
import { parseBoundaries } from '@nan0web/ai'
const raw = '---boundary:src/app.js---\nconsole.log(1)\n---boundary---'
const files = parseBoundaries(raw)
```
## MCP Сервер

Відкрийте інструменти семантичного пошуку для інших додатків як MCP (Model Context Protocol) сервер.

Як встановити MCP сервер?
```js
nan0ai mcp install
```
## Архітектура

```
@nan0web/ai
├── domain/             — Основна бізнес-логіка
│   ├── AI.js           — Уніфіковане ядро провайдерів
│   ├── AiStrategy.js   — Логіка оцінки та fallback
│   ├── VectorDB.js     — Робота з HNSWLib
│   └── Embedder.js     — Трансформації Text-to-Vector
└── agents/             — Делегати високорівневих завдань
    ├── AgentOrchestrator.js — Динамічне делегування завдань
    ├── CnaiRefactorAgent.js — Інтелект рефакторингу
    └── BoundaryParser.js    — Парсинг протокола
```

Як перевірити вимоги пакета до engine?

## Внесок

Як взяти участь? – [див. CONTRIBUTING.md]($pkgURL/blob/main/CONTRIBUTING.md)

## Ліцензія

ISC LICENSE – [див. повний текст]($pkgURL/blob/main/LICENSE)
