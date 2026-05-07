# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/) and [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) standards.

## [1.5.0] - 2026-05-07
### Added
- **Source Code Indexing**: expanded coverage to include `.jsx`, `.tsx`, and `.py` files in the `source` scope.
- **`nan0ai ls` command**: new `ListIndexIntent` for inspecting indexed files within specific workspace indices.
- **Smart Project Filtering**: implemented segment-based matching for `-p` flag across all commands (`ls`, `show`, `search`).
  - Supports exact segment match (default): `-p ui` matches `packages/ui` but not `packages/ui-cli`.
  - Supports `@scope/name` resolution via store registry: `-p @nan0web/ui` matches correctly.
  - Supports glob/wildcard patterns: `-p ui*` matches all UI packages.
- **Scope Filtering**: added `--scope` / `-s` support to `nan0ai show`.

### Fixed
- **Monorepo Indexing Distortion**: `MarkdownIndexer` now correctly identifies `src` and `types` folders at any nesting level, enabling robust indexing from the workspace root.
- **Intent Testability**: `ListIndexIntent` and `ShowIndexIntent` now support dependency injection, enabling 100% Zero-Disk (memory-only) contract testing.
- **Path Resolution**: Fixed leading slash and incorrect `path.relative` logic in `MarkdownIndexer` that caused empty content extraction in monorepo structures.
- **Search Resolution**: `MarkdownIndexer` now uses the correct store database for project directory lookups in `search()`.
- **Stale cache contamination**: `nan0ai ls` now validates file paths against project directory to hide leaked files from previous indices.
- **Mount registry safety**: Isolated `storeDb` as a separate `DBFS` instance in `IndexWorkspaceApp.js` to prevent "Mount registry is sealed" error during mass indexing.
- **Regression Tests**: Fixed relative import paths in tests after moving them to `src/test/releases/`.

## [1.4.1] - 2026-04-29
### Added
- Auto-discovery fallback for workflows in `SyncWorkspaceApp.js` (scans `src/agents/workflows/*.md` automatically).
### Fixed
- MCP Server: corrected `nan0web_store.csv` path resolution (now uses `~/.nan0web/store`).
- `SyncWorkspaceApp.js`: case-insensitive package mapping.
- `VectorDB.js`: removed legacy callback-based `fs` usage, implemented resilient `DBFS` initialization.
- `nan0ai index`: improved error messages with project names.

## [1.4.0] - 2026-04-28
### Added
- Agent Orchestration system (`AgentOrchestrator`).
- Specialized `CnaiRefactorAgent` for code refactoring tasks.
- `BoundaryParser` for OLMUI protocol boundary detection.
- Unified yield-based progress reporting for long-running agents.

## [1.3.0] - 2026-04-27
### Changed
- Model-as-Schema v2 compliance for `VectorDB` and `Embedder`.
- Infrastructure isolation using `this._.db`.
- Improved contextual `ModelError` with $-parameters.

## [1.2.0] - 2026-04-25
### Added
- HNSWLib Vector RAG integration.
- `Embedder` for local OpenAI-compatible API (LM Studio / llama.cpp).
- `VectorDB` wrapper with persistence and metadata sidecars.
- `MarkdownIndexer` for header-aware ethical chunking.
- MCP Server (`bin/mcp-server.js`) with `search_knowledge_base` tool.

## [1.1.0] - 2026-04-20
### Added
- Multiplier Scoring Matrix for intelligent model selection.
- Async `streamText` fallback and lazy SDK imports for performance.

## [1.0.1] - 2026-04-15
### Fixed
- Major refactoring and architecture enforcement.
- Moved domain models to `src/domain/`.

## [1.0.0] - 2026-04-10
### Added
- Initial release: Unified AI Kernel for NaN0Web ecosystem.
