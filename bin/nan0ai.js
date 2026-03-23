#!/usr/bin/env node

/**
 * nan0ai — Unified CLI for @nan0web/ai
 * 
 * Commands:
 *   index [options]    Build search indices
 *   search [options]   Semantic search across workspace
 *   mcp install        Install MCP server to IDEs
 */

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const cmd = args[0]

const BIN_MAP = {
	'index': 'index-workspace.js',
	'search': 'search-workspace.js',
	'query': 'search-workspace.js',
	'mcp': 'mcp-install.js',
}

function showHelp() {
	console.log(`
\x1b[36mNaN0 AI Toolkit (nan0ai)\x1b[0m — Unified interface for RAG and AI tools.

\x1b[33mUsage:\x1b[0m
  nan0ai <command> [options]

\x1b[33mCommands:\x1b[0m
  index       Build multi-level HNSW vector indices for the workspace.
  search      Semantic search across indexed documentation (alias: query).
  mcp install Install MCP server into Claude Desktop, Windsurf, etc.
  --help, -h  Show this help message.

\x1b[33mExamples:\x1b[0m
  nan0ai index -p 0HCnAI
  nan0ai search "how to generate gallery"
  nan0ai mcp install
`)
}

if (!cmd || cmd === '--help' || cmd === '-h') {
	showHelp()
	process.exit(0)
}

// Handle complex commands like "mcp install"
let scriptName = BIN_MAP[cmd]
let scriptArgs = args.slice(1)

if (cmd === 'mcp' && args[1] === 'install') {
	scriptName = 'mcp-install.js'
	scriptArgs = args.slice(2)
}

if (!scriptName) {
	console.error(`\x1b[31mUnknown command: ${cmd}\x1b[0m`)
	showHelp()
	process.exit(1)
}

const scriptPath = path.join(__dirname, scriptName)

const proc = spawn('node', [scriptPath, ...scriptArgs], {
	stdio: 'inherit'
})

proc.on('exit', (code) => {
	process.exit(code || 0)
})
