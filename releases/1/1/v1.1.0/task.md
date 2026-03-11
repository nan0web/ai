[English](./task.en.md) | [Українська](./task.md)

# Release v1.1.0 (Scoring Matrix & Exports)

## Що саме робимо (Scope)
Цей реліз втілює наступні кроки з `REQUESTS.md`:
1. **Скоринг-Матриця**: Розширення стратегії в `AI.js` до рівня розумної скоринг-матриці з мультиплікаторами, відбраковуванням на основі вимог до промпту (`finance`, `speed`, `volume`, `level`), та розумною чергою (Queue) для Fallback-у замість базового 429 перехоплення.
2. **Експорти**: Відкриття необхідних класів (зокрема `ProviderConfig`, `Architecture`, `ModelProvider`) назовні через `src/index.js`.

## Acceptance criteria (Definition of Done)
1. Пакет експортує `ProviderConfig`, `Architecture`, та інші доменні структури.
2. В `AI.js` реалізовано методи для підрахунку скорингу моделей.
3. В `AI.js` реалізовано логіку формування черги (Fallback Queue) на основі балів.
4. Інтеграція `@nan0web/ai` з `subagent` у фреймворку `0HCnAI.framework` відбудеться паралельним релізом після закриття цього релізу.
