# Mission: Model-as-Schema v2 & Contextual Error Standardization (@nan0web/ai v1.3.0)

## 🏁 Огляд (Overview)
Цей реліз завершує повну архітектурну міграцію пакунка `@nan0web/ai` на стандарт **Model-as-Schema v2**. Всі доменні моделі стандартизовані за конструктором, успадковують базовий `Model`, використовують `static UI` для i18n та передають помилки виключно через `ModelError` з контекстуальними `$`-параметрами.

## 🎯 Задачі (Scope)
1. **Model v2 Compliance**:
   - [x] Всі 14 доменних класів успадковують `Model`.
   - [x] Використовується єдиний конструктор `constructor(data = {}, options = {}) { super(data, options) }`.
   - [x] Видалено всі ініціалізатори полів класу (class fields) поза `static`.
2. **Contextual ModelError Enforcement**:
   - [x] Повна відмова від `new Error()` всередині моделей.
   - [x] Використання `ModelError` для всіх системних винятків.
   - [x] Впровадження `$`-префіксів для динамічних значень (напр. `$expected`, `$actual`, `$status`).
3. **Infrastructure Isolation**:
   - [x] `VectorDB` та `ModelProvider` ізольовані через `this._.db`.
   - [x] Забезпечено fallback на рідні модулі Node.js (`fs/promises`) при відсутності інжектованого `db`.
4. **TypeScript Strict Mode & Stability**:
   - [ ] Анотування instance властивостей (JSDoc `/** @type */`) в усіх конструкторах, оскільки TS не бачить `static`-схему як властивості об'єкта.
   - [ ] Використання `Partial<import('@nan0web/types').ModelOptions>` у конструкторах для повної сумісності зі `strict` TS.
   - [ ] Забезпечення коректних мета-полів (наприклад `$project`) у yield логах `AiAppModel.index()`, необхідних для проходження контрактів.
   - [ ] Розширення `.npmignore` для виключення тестових файлів, логів, та внутрішньої документації (`docs/`, `reports/`, `.datasets/`).

## ✅ Acceptance Criteria (DoD)
- [ ] Аудитор `node bin/inspect-models.js` показує 100% відповідність для `Tier 1` (Score 80-100).
- [ ] Всі 39 існуючих тестів проходять (Regression Pass).
- [ ] Контрактні тести `task.spec.js` для `v1.3.0` проходять.
- [ ] TypeScript build (`npm run build`) проходить з 0 помилок.
- [ ] Linter/Prettier (`npm run lint`) показує успіх або виправлено автоматично.
- [ ] Всі CLI Галерея та Web Галерея не мають деструктивних змін.

---
**АрхіТехноМаг**
— Архітектурна лінія вирівняна. Ядро AI стає еталоном Model-as-Schema v2.
