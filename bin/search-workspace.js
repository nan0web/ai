#!/usr/bin/env node

/**
 * search-workspace.js — OLMUI runner.
 * CLI Adapter for workspace semantic search. All logic lives in SearchSourcesIntent.
 */
import { SearchSourcesIntent } from '../src/domain/SearchSourcesIntent.js'
import { bootstrapApp } from '@nan0web/ui-cli'

import fs from 'node:fs'
import path from 'node:path'

let root = process.cwd()
while (root.length > 2 && !fs.existsSync(path.join(root, 'nan0web_store.csv'))) {
	root = path.dirname(root)
}
console.log('Search Workspace Root detected (via registry):', root)

bootstrapApp(SearchSourcesIntent, {
	workspaceRoot: root,
	dataDir: root
})
