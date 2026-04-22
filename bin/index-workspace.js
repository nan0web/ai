#!/usr/bin/env node

/**
 * index-workspace.js — OLMUI runner. 
 * CLI Adapter for workspace indexing. All logic lives in IndexWorkspaceApp.
 */
import { IndexWorkspaceApp } from '../src/domain/IndexWorkspaceApp.js'
import { bootstrapApp } from '@nan0web/ui-cli'

import fs from 'node:fs'
import path from 'node:path'

let root = process.cwd()
while (root.length > 2 && !fs.existsSync(path.join(root, 'nan0web_store.csv'))) {
	root = path.dirname(root)
}
console.log('Indexer Workspace Root detected (via registry):', root)

bootstrapApp(IndexWorkspaceApp, {
	workspaceRoot: root,
	dataDir: root
})
