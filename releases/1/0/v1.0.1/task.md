[English](./task.en.md) | [Українська](./task.md)

# Release v1.0.1 (Refactoring & Architecture Enforcement)

## Що саме робимо (Scope)
Цей реліз формалізує та фіксує існуючі архітектурні зміни, які були зроблені для впровадження OLMUI та Zero-Trust принципів у пакеті `@nan0web/ai`, що зараз лежать не зафіксованими.

## Acceptance criteria (Definition of Done)
1. **Рефакторинг структури**: Вся бізнес-логіка (`AI`, `Architecture`, `Limits`, `ModelInfo`, `ModelProvider`, `Pricing`, `Usage`, `TopProvider`) переміщена з кореня `src/` у директорію `src/domain/`.
2. **Очищення**: Пакет очищено від зайвих утиліт (видалено `src/utils/yaml.js` та `src/utils/index.js`).
3. **Обробка помилок (ModelError)**: `ModelProvider` містить метод валидації апі ключа, та статичний словник `ui` за патерном Model-as-Schema.
4. **Data-Driven Docs**: Проєкт містить `project.md` та локалізовану документацію у `docs/`.
5. **Пакетні скрипти**: Скрипт `test` у `package.json` використовує надійний glob `src/**/*.test.js`.

## Architecture Audit
- [x] Чи прочитано Індекси екосистеми?
- [x] Чи існують аналоги в пакетах?
- [x] Джерела даних: YAML, nano, md, json, csv?
- [x] Чи відповідає UI-стандарту (Deep Linking)?
