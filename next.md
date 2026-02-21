# 🧠 @nan0web/ai — Next Steps

> - **Мета:** Повноцінна інтеграція `@nan0web/ai` в існуючі продукти
> - **Споживачі:** `sun.app` (SunIntelligence), `llimo.app`, `@industrialbank/currencies`

---

## 🟢 Крок 1: Інтеграція з sun.app

Замінити `SunIntelligence.js` (хардкод Cerebras) на використання `@nan0web/ai`.

```js
// sun.app/src/ui-chat/SunIntelligence.js (НОВА ВЕРСІЯ)
import { AI } from '@nan0web/ai'

export class SunIntelligence {
  constructor() {
    this.ai = new AI() // auto-detect: CEREBRAS, OPENROUTER, OPENAI, LLAMACPP
  }

  async *ask(prompt, context, systemPromptOverride = null) {
    const model = this.ai.findBestModel() // Стратегія вибору
    yield* this.ai.streamText(model, [
      { role: 'system', content: systemPromptOverride || this.getSystemPrompt(context) },
      ...(context.history || []).slice(-20),
      { role: 'user', content: prompt },
    ])
  }
}
```

## 🟢 Крок 2: Авто-Fallback (429/402)

Ядро вже має підтримку кількох провайдерів та `AiStrategy`, але потрібно додати автоматичний повтор запиту з іншою моделлю у разі падіння основного провайдера (наприклад, Cerebras видав 429 Rate Limit → автоматично переключити на HuggingFace/LlamaCpp).

## 🟢 Крок 3: Перенесення Snapshot-тестів у CLI

Реалізувати геніальну ідею мета-тестування (`test/spanshots/*.yaml` декларативного тестування генераторів). Оскільки генератори (`yield new Alert()`, `yield new Table()`) були перенесені з ядра `ai` до CLI (`llimo.app` / `@nan0web/ui-cli`), то цей Test Runner потрібно написати саме там:

```yaml
# Приклад декларативного тесту:
argv: ['list', '--fix']
run:
  - Alert: Listed 0 chats.
    $variant: info
```
