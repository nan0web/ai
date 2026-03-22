# План наступних дій (Next Steps)

## 🏁 Виконано (Done)

- [x] Рефакторинг структури: переміщено бізнес-логіку та класи в `src/domain/`.
- [x] Очищено пакет від зайвих утиліт (`src/utils/yaml.js`).
- [x] Інтегровано `ModelError` з `@nan0web/types` для всіх помилок.
- [x] Впроваджено `Model-as-Schema` для помилок: винесено тексти повідомлень у `static ui` з підтримкою змінних `{provider}`, `{envVar}`.
- [x] Централізовано валідацію API ключів у `ModelProvider.validateApiKey()`.
- [x] Виправлено запуск тестів через глоб `src/**/*.test.js`.
- [x] Оновлено `README.md.js` та згенеровано актуальний `README.md`.
- [x] **Data-Driven Docs**: Створено кореневий роутер `project.md` та ієрархію `docs/uk/` і `docs/en/`.
- [x] **Localize Workflow**: Зафіксовано нове правило для `docs-site.md` (копіювання `README.md` в `docs/en/README.md`).
- [x] **AI Adapter**: розширено підтримку нових провайдерів через єдиний інтерфейс `ModelProvider` та додано скоринг-матрицю для черги фолбеку.
- [x] **Externalized AI Strategy**: Апробовано паттерн `ai-strategy.yaml` (data-driven fallback chain) у пілотному проєкті `eaukraine.eu`.

## 🚀 Найближчі плани (Todo)

- [x] **Multiplicative Scoring Matrix**: імплементувати розумний вибір моделей на основі `volume`, `speed`, `finance` та множників (наприклад, Multiplier=0 для невідповідної довжини контексту).
- [x] **Vector RAG v1.2.0**: HNSWLib VectorDB + Embedder (LM Studio) + MarkdownIndexer + MCP Server (`search_knowledge_base`).
- [ ] **Interface Welding**: додати snapshot-тести для `ModelProvider` (імітація відповідей API).
- [ ] **Strict i18n Typization**: перевірити використання термінів у `static ui` через словники.
- [ ] **Docs Site**: Налаштувати npm скрипти (docs:dev / docs:build) для запуску документації через `nan0web.app`.
- [ ] **Performance**: впровадити семантичний кеш для відповідей (за потреби).
- [ ] **Vector RAG v1.3.0**: auto-reindex при зміні .md файлів (file watcher), інкрементальна індексація.

---

**АрхіТехноМаг**
— План зафіксовано для твОго повернення.
