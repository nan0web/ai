---
version: 1.5.0
type: feature
status: active
locale: en
models: []
---

# 🚀 Mission: Source Code Indexing & Index Listing

[Українська версія](./task.md)

## 🏁 Overview
Source file indexing (`src/**/*.{js,jsx,ts,tsx}`) does not return relevant results when searching via `nan0ai search -s source`. Additionally, there is no command to list the actual **files** that have been indexed, filtered by scope.

**Root causes:**
1. `MarkdownIndexer.scanRecursive()` — the `isSource` regexp did not include `.jsx` and `.tsx` extensions.
2. `MarkdownIndexer.scanRecursive()` — the `inTypesFolder` logic was too strict (root-only), causing "indexing distortion" in monorepos.
3. `ListIndexIntent` and `ShowIndexIntent` did not support DB dependency injection, making them untestable.
4. No `nan0ai ls` command existed for listing indexed files.

## 👥 User Stories

1. **As a developer**, when running `nan0ai search "class ModelAsApp" -s source`, I want to receive real snippets from `src/` and `types/` files so I can quickly find classes and logic.

2. **As a developer**, when running `nan0ai ls -p ui -s source`, I want to see a list of **files** only for the `source` scope and packages matching `*ui*`, to understand what has been indexed.

## 🎯 Scope
- [x] Extend `isSource` regexp in `MarkdownIndexer.scanRecursive()` to support `.jsx` and `.tsx` extensions
- [x] Fix "indexing distortion" in monorepos (flexible `src`/`types` folder detection)
- [x] Ensure Intent testability via `db` injection
- [x] Migrate all contract tests to Zero-Disk (Memory-Only) mode
- [x] Add `scope` filter to `ShowIndexIntent` (CLI: `nan0ai show -s source -p ui`)
- [x] Create `ListIndexIntent` (alias `ls`) for listing indexed files (CLI: `nan0ai ls -s source -p ui`)
- [x] Register `ListIndexIntent` in `AiAppModel`

## ✅ Acceptance Criteria (DoD)
- [x] **Contract tests** (`task.spec.js`) written and passing (Green).
- [x] **MarkdownIndexer** scans `.js`, `.jsx`, `.ts`, `.tsx` files in `source` scope.
- [x] **ShowIndexIntent** supports `--scope` / `-s` parameter for filtering index metadata.
- [x] **ListIndexIntent** (`nan0ai ls`) shows file listing with `-s scope` and `-p project` filtering.
- [x] **Regression** — existing tests do not break.
