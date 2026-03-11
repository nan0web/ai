[English](./task.en.md) | [Українська](./task.md)

# Release v1.1.0 (Scoring Matrix & Exports)

## Scope
This release implements the following steps from `REQUESTS.md`:
1. **Scoring Matrix**: Upgrading the strategy in `AI.js` to a smart scoring matrix with multipliers, discarding based on prompt requirements (`finance`, `speed`, `volume`, `level`), and implementing a smart Fallback Queue instead of basic 429 interception.
2. **Exports**: Exporting the required classes (specifically `ProviderConfig`, `Architecture`, `ModelProvider`) outwards via `src/index.js`.

## Acceptance criteria (Definition of Done)
1. The package exports `ProviderConfig`, `Architecture`, and other domain models.
2. `AI.js` implements methods for calculating model scores.
3. `AI.js` implements logic to build a Fallback Queue based on scores.
4. Integration of `@nan0web/ai` with `subagent` in the `0HCnAI.framework` will happen in a parallel release after closing this release.
