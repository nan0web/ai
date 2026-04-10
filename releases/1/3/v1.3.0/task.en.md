# Mission: Model-as-Schema v2 & Contextual Error Standardization (@nan0web/ai v1.3.0)

*(Translation of [task.md](./task.md))*

## 🏁 Overview
This release completes the final architectural migration of the `@nan0web/ai` package to the **Model-as-Schema v2** standard. All domain models have been standardized via the constructor, inherit from the base `Model`, use `static UI` for i18n, and propagate errors exclusively through `ModelError` with contextual `$`-parameters. It also integrates TypeScript strict typing stabilization.

## 🎯 Scope
1. **Model v2 Compliance**:
   - [x] All 14 domain classes inherit from `Model`.
   - [x] A unified constructor is used: `constructor(data = {}, options = {}) { super(data, options) }`.
   - [x] All class field initializers outside of `static` have been removed.
2. **Contextual ModelError Enforcement**:
   - [x] Complete deprecation of `new Error()` inside models.
   - [x] Use `ModelError` for all system exceptions.
   - [x] Implementation of `$`-prefixes for dynamic values (e.g., `$expected`, `$actual`, `$status`).
3. **Infrastructure Isolation**:
   - [x] `VectorDB` and `ModelProvider` are isolated via `this._.db`.
   - [x] Native Node.js module fallback (`fs/promises`) has been ensured when the injected `db` is missing.
4. **TypeScript Strict Mode & Stability**:
   - [ ] Annotation of instance properties (JSDoc `/** @type */`) in all constructors, because TS does not see `static`-schema as object properties.
   - [ ] Usage of `Partial<import('@nan0web/types').ModelOptions>` in constructors for full compatibility with `strict` TS.
   - [ ] Provisioning of correct meta-fields (e.g., `$project`) in yield logs of `AiAppModel.index()`, necessary to pass regression contracts.
   - [ ] Expanding `.npmignore` to exclude test files, logs, and internal documentation (`docs/`, `reports/`, `.datasets/`).

## ✅ Acceptance Criteria (DoD)
- [ ] Auditor `node bin/inspect-models.js` shows 100% compliance for `Tier 1` (Score 80-100).
- [ ] All 39 existing tests pass (Regression Pass).
- [ ] Contract tests `task.spec.js` for `v1.3.0` pass.
- [ ] TypeScript build (`npm run build`) outputs 0 errors.
- [ ] Linter/Prettier (`npm run lint`) passes successfully or automatically fixes style issues.
- [ ] CLI Gallery and Web Gallery tests show no destructive changes.

---
**ArchiTechnoMag**
— The architectural line is leveled. The AI Core becomes a benchmark for Model-as-Schema v2.
