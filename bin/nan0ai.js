#!/usr/bin/env node

/**
 * nan0ai — Unified CLI for @nan0web/ai (OLMUI Edition)
 * All logic is dispatched via AiAppModel.
 */
import { AiAppModel } from '../src/domain/AiAppModel.js'
import { bootstrapApp } from '@nan0web/ui-cli'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'

const HOME = os.homedir()
const GLOBAL_CONFIG_DIR = path.join(HOME, '.nan0ai')
const CONTEXT_PATH = path.join(GLOBAL_CONFIG_DIR, 'context.nan0')

let root = process.cwd()
let found = false

// 1. Try to find local workspace marker (monorepo root)
while (root.length > 2) {
	const marker = path.join(root, 'pnpm-workspace.yaml')
	if (
		fs.existsSync(path.join(root, 'nan0web_store.csv')) ||
		fs.existsSync(marker) ||
		fs.existsSync(path.join(root, 'lerna.json'))
	) {
		found = true
		break
	}
	root = path.dirname(root)
}
if (found) console.log(`nan0ai: Found workspace root at ${root}`)
else console.log(`nan0ai: Workspace root not found, using ${root}`)

// 2. Fallback to global context if not found locally
if (!found && fs.existsSync(CONTEXT_PATH)) {
	try {
		const contextRaw = fs.readFileSync(CONTEXT_PATH, 'utf8')
		const match = contextRaw.match(/lastWorkspace:\s*(.+)/)
		if (match && match[1] && fs.existsSync(match[1].trim())) {
			root = match[1].trim()
			found = true
		}
	} catch (e) {}
}

if (!found) {
	console.error('❌ Error: No NaN•Web workspace found (nan0web_store.csv missing).')
	console.error('Please run "nan0ai" inside your monorepo first to register it.')
	process.exit(1)
}

// 3. Persist successful root as last active context
if (!fs.existsSync(GLOBAL_CONFIG_DIR)) fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true })
fs.writeFileSync(CONTEXT_PATH, `lastWorkspace: ${root}\n`)

bootstrapApp(AiAppModel, {
	root,
	workspaceRoot: root,
	appName: 'nan0ai'
})
