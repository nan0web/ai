---
version: 1.4.2
type: bugfix
status: done
locale: en
models: []
---

[Українською](task.md)

# 🚀 Mission: Fix sealed DB store mount error in IndexWorkspaceApp

## 🏁 Overview
Fixing the "Mount registry is sealed" error during `nan0ai index`, which occurs because `storeDb` used `this._.db` (which is already sealed), instead of creating a new isolated `DBFS` instance.

## 👥 User Stories
> As a developer, I want to execute `nan0ai index -p bank --force --skip-data` without the "Mount registry is sealed" error, to successfully index my project.

## 🏗 Data-Driven Architecture
No new models. Modifying only the `storeDb` initialization in `IndexWorkspaceApp.js`.

## 🎯 Scope
- [x] Fix `IndexWorkspaceApp.js` `indexFull()`: implement try/catch fallback to use a new `DBFS` instance if the provided `this._.db` is sealed.

## ✅ Acceptance Criteria (DoD)
- [x] Contract tests (`task.spec.js`) are written and pass successfully (Green).
- [x] The "Mount registry is sealed" error no longer appears when running `indexFull()`.
