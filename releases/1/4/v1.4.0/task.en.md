# Mission: Agent Orchestrator & CNAI Boundaries (@nan0web/ai v1.4.0)

*(Translation of [task.md](./task.md))*

## 🏁 Overview
This release adds the autonomous subagent subsystem (Subagent Orchestrator). According to the Two Spaces architecture (`ask` for User Space, `agent` for Developer Space), `AgentOrchestrator` becomes the single entry point for executing tasks (deterministic `sys:*` and non-deterministic `cnai:*`). Agents use the `Boundary Format` to reliably exchange files via text prompts.

## 🎯 Scope
1. **Agent Registry & Orchestrator**:
   - [ ] Create `src/agents/index.js` as an agent registry (re-export `SysBuildAgent`, `BoundaryParser`).
   - [ ] Implement `AgentOrchestrator` (`src/agents/AgentOrchestrator.js` or `runAgent.js`) that resolves agents by their `static alias` and iterates their generator.
   - [ ] Export the orchestrator at the package level.
2. **CnaiRefactorAgent**:
   - [ ] Create `CnaiRefactorAgent.js` (an LLM agent for automated file refactoring).
   - [ ] Use `this._.ai` (`generateText`) to generate responses via `toPrompt()`.
   - [ ] Parse the LLM response using the existing `BoundaryParser`.
3. **BoundaryParser Robustness**:
   - [ ] Write unit tests for `BoundaryParser.js` to ensure robustness (e.g., snippets, full boundaries).
4. **Contracts**:
   - [ ] All agents must inherit from `Model` and define a `static alias`.
   - [ ] All agents must implement an `async *run()` generator yielding `{ type: 'result', success, files, message }`.

## ✅ Acceptance Criteria (DoD)
- [ ] Contract tests `task.spec.js` for `v1.4.0` are passing (`Red` → `Green`).
- [ ] The Orchestrator successfully resolves `SysBuildAgent` via 'sys:build'.
- [ ] The Orchestrator safely returns an error result for unknown tasks ('unknown:agent').
- [ ] `BoundaryParser` is fully covered by tests.
- [ ] `npm run test:all` (Unit, Docs, Specs, TypeScript, Prettier, Knip) is successfully green.
