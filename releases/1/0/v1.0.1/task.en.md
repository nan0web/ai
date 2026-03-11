[English](./task.en.md) | [Українська](./task.md)

# Release v1.0.1 (Refactoring & Architecture Enforcement)

## Scope
This release formalizes and solidifies the existing architectural changes that were made to implement OLMUI and Zero-Trust principles in the `@nan0web/ai` package, which are currently uncommitted.

## Acceptance criteria (Definition of Done)
1. **Structural Refactoring**: All business logic (`AI`, `Architecture`, `Limits`, `ModelInfo`, `ModelProvider`, `Pricing`, `Usage`, `TopProvider`) has been moved from the `src/` root into the `src/domain/` directory.
2. **Cleanup**: The package is cleaned from unnecessary utilities (removed `src/utils/yaml.js` and `src/utils/index.js`).
3. **Error Handling (ModelError)**: `ModelProvider` includes an API key validation method and a static `ui` dictionary following the Model-as-Schema pattern.
4. **Data-Driven Docs**: The project includes `project.md` and localized documentation in `docs/`.
5. **Package Scripts**: The `test` script in `package.json` uses a solid glob `src/**/*.test.js`.

## Architecture Audit
- [x] Have ecosystem indexes been read?
- [x] Do analogs exist in packages?
- [x] Data sources: YAML, nano, md, json, csv?
- [x] Does it comply with UI standards (Deep Linking)?
