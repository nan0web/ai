---
version: 1.5.0
type: feature
status: active
locale: uk
models: []
---

# 🚀 Mission: Source Code Indexing & Index Listing

[English version](./task.en.md)

## 🏁 Overview (Огляд)
Індексація source файлів (`src/**/*.{js,jsx,ts,tsx}`) не повертає релевантних результатів при пошуку через `nan0ai search -s source`. Також відсутня можливість переглянути список проіндексованих **файлів** із фільтрацією за scope.

**Кореневі причини:**
1. `MarkdownIndexer.scanRecursive()` — регексп `isSource` не включав `.jsx` та `.tsx` розширення.
2. `MarkdownIndexer.scanRecursive()` — логіка визначення `inTypesFolder` була надто суворою (лише корінь), що ігнорувало сорс-файли у монорепозиторії (викривлення індексації).
3. `ListIndexIntent` та `ShowIndexIntent` не підтримували ін'єкцію залежностей (DB), що робило їх нетестованими.
4. Відсутня команда `nan0ai ls` для лістингу проіндексованих файлів.

## 👥 User Stories (Сценарії)

1. **Як розробник**, виконуючи `nan0ai search "class ModelAsApp" -s source`, я хочу отримувати реальні сніпети з `src/` і `types/` файлів пакетів, щоб швидко знаходити класи та логіку.

2. **Як розробник**, виконуючи `nan0ai ls -p ui -s source`, я хочу бачити список **файлів** лише для `source` scope та конкретного пакету `*ui*`, щоб розуміти що саме проіндексовано.

## 🎯 Scope (Задачі)
- [x] Розширити `isSource` regexp у `MarkdownIndexer.scanRecursive()` для підтримки `.jsx` та `.tsx` розширень
- [x] Виправити "викривлення" індексації у монорепозиторії (гнучкий пошук `src`/`types` папок)
- [x] Забезпечити тестованість Intent-ів через ін'єкцію `db`
- [x] Перевести всі контрактні тести на Zero-Disk (Memory-Only) режим
- [x] Додати `scope` фільтр до `ShowIndexIntent` (CLI: `nan0ai show -s source -p ui`)
- [x] Створити `ListIndexIntent` (alias `ls`) для лістингу проіндексованих файлів (CLI: `nan0ai ls -s source -p ui`)
- [x] Зареєструвати `ListIndexIntent` у `AiAppModel`

## ✅ Acceptance Criteria (DoD)
- [x] **Контрактні тести** (`task.spec.js`) написані і успішно проходять (Green).
- [x] **MarkdownIndexer** сканує `.js`, `.jsx`, `.ts`, `.tsx` файли у scope `source`.
- [x] **ShowIndexIntent** підтримує `--scope` / `-s` параметр для фільтрації метаданих індексів.
- [x] **ListIndexIntent** (`nan0ai ls`) показує список файлів з фільтрацією `-s scope` та `-p project`.
- [x] **Регресія** — існуючі тести не ламаються.

## 📊 Прогрес: 100% (Фіналізація)

### ✅ Виконано:
1. **MarkdownIndexer**: оновлено regexp для `.jsx`, `.tsx`, `.py` та виправлено логіку `inTypesFolder` для монорепозиторіїв.
2. **Intent Testability**: додано підтримку `this._.db` у `ShowIndexIntent` та `ListIndexIntent`.
3. **Zero-Disk QA**: всі контрактні тести переписано на роботу виключно з In-Memory DB (без запису на диск).
4. **ShowIndexIntent**: додано фільтрацію `-s scope` (docs, source, data) та смарт-фільтрацію проєктів `-p`.
5. **ListIndexIntent (`ls`)**: новий намір для перегляду списку файлів в індексі.
6. **Smart Project Filter**:
   - Реалізовано в `src/domain/projectFilter.js`.
   - Підтримка `@scope/name` (резолвінг через Store CSV).
   - Підтримка глобів (`ui*`) та точного співпадіння сегментів.
   - Захист від забруднених кешів (фільтрація шляхів у `ls`).
7. **QA**: 100% тестів пройдено (unit, stories, spec, lint).

### 🚀 Наступні кроки:
- Реліз v1.5.0.
- Моніторинг StackDetector @todo.
