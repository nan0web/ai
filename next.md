# 🏗️ Architecture Audit — Healing Report

**Score: {passed}/{total} ({pct}%)**

## Issues Found
- [ ] [feature] `search --sources`: Build native semantic indexed source cache (v1.5.0)
- [ ] [phase] CONTRIBUTING.md: `Missing fundamental file: {file}`
- [ ] [phase] .editorconfig: `Missing fundamental file: {file}`
- [ ] [hygiene] scripts.play: `Missing required script: {script}`
- [ ] [hygiene] scripts.test:release: `Missing required script: {script}`
- [ ] [exports] src/domain/index.js: `src/domain/ exists but src/domain/index.js is missing`
- [ ] [verification] play/: `No play/ directory found — playground is mandatory for every package`

## Recommended Subagents
- `@[/inspect-structure]`
- `@[/package-hygiene]`
- `@[/inspect-anti-pattern]`
- `@[/inspect-jsdoc]`
