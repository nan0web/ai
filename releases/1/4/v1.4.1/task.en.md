---
version: 1.4.1
type: feature
status: completed
locale: en
models: []
---

[Українською](task.md)

# 🚀 Mission: MCP Protocol Stabilization & Sync Fallback

## 🏁 Overview
After system reboot, a destabilization in the MCP protocol and workflow synchronization mechanism was discovered. This release fixes the paths to the package registry in the MCP server and introduces a resilient synchronization fallback mechanism, which allows Antigravity to discover workflows even if they are not explicitly registered in `nan0web.nan0`. It also fixes a critical bug in `VectorDB` that caused the MCP server to crash when a database provider was missing.

## 👥 User Stories
> As a developer, I want `nan0ai sync` to automatically discover and synchronize all workflows from `src/agents/workflows/` directories, so that I don't have to manually register every new file in `nan0web.nan0`.

> As an Antigravity user, I want the `nan0web-knowledge` MCP server to consistently discover indices of all monorepo packages, regardless of where the editor was launched from.

## 🏗 Data-Driven Architecture
- **Case-Insensitive Mapping**: `SyncWorkspaceApp` now uses case-insensitive search for package names in `nan0web_store.csv`.
- **Auto-Discovery Fallback**: Added automatic scanning of standard workflow paths for each known package.
- **Resilient VectorDB**: `VectorDB` now consistently initializes a default `DBFS` driver, eliminating callback-based crashes in the asynchronous MCP environment.

## 🎯 Scope
- [x] Fix the path to `nan0web_store.csv` in `bin/mcp-server.js` (use `~/.nan0web/store`).
- [x] Fix `SyncWorkspaceApp.js`: make `packageDirs` search case-insensitive.
- [x] Implement automatic scanning for `src/agents/workflows/*.md` in each package as a fallback.
- [x] Update `next.md`: move completed tasks to the done section.
- [x] Fix `VectorDB.js`: remove callback-based `fs` and add default DBFS.
- [x] Improve error informativeness in `nan0ai index` (added project name to the error).

## ✅ Acceptance Criteria (DoD)
- [x] `nan0ai sync` synchronizes all workflows, including unregistered ones.
- [x] MCP server successfully loads databases for all packages.
- [x] `nan0ai index` outputs informative errors with project names.
- [x] Regression tests for `v1.2.0` and `v1.3.0` pass successfully.
