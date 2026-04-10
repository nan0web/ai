#!/usr/bin/env node

/**
 * mcp-install.js — Simple CLI to help users install the nan0web-knowledge MCP server into various IDEs.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mcpServerPath = path.resolve(__dirname, 'mcp-server.js')
const EMBEDDER_URL = process.env.EMBEDDER_URL || 'http://localhost:1234/v1'

const IDE_CONFIGS = [
	{
		name: 'Gemini CLI (Antigravity)',
		path: path.join(os.homedir(), '.gemini/settings.json'),
		platform: 'all'
	},
	{
		name: 'Claude Desktop',
		path: path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json'),
		platform: 'darwin'
	},
	{
		name: 'Windsurf',
		path: path.join(os.homedir(), '.codeium/windsurf/mcp_config.json'),
		platform: 'all'
	},
	{
		name: 'VS Code (experimental via Marketplace extensions)',
		path: 'manual',
		platform: 'all'
	}
]

async function main() {
	console.log(`\n\x1b[36m🚀 @nan0web/ai — MCP Installation Helper (v1.3.0)\x1b[0m`)
	console.log(`\x1b[90mServer Path: ${mcpServerPath}\x1b[0m\n`)

	const configEntry = {
		command: 'node',
		args: [mcpServerPath],
		env: {
			EMBEDDER_URL
		}
	}

	for (const ide of IDE_CONFIGS) {
		if (ide.platform !== 'all' && ide.platform !== process.platform) continue

		console.log(`\x1b[33m[${ide.name}]\x1b[0m`)
		
		if (ide.path === 'manual') {
			console.log(`  👉 To install, add this to your MCP configuration inside the IDE:`)
			console.log(`\x1b[90m${JSON.stringify({ "nan0web-knowledge": configEntry }, null, 2)}\x1b[0m\n`)
			continue
		}

		const dirPath = path.dirname(ide.path)
		try {
			await fs.access(dirPath)
		} catch (e) {
			console.log(`  \x1b[90m⏩ Skipped (IDE not found: ${dirPath})\x1b[0m\n`)
			continue
		}

		try {
			let current = {}
			try {
				const raw = await fs.readFile(ide.path, 'utf-8')
				current = JSON.parse(raw)
			} catch (e) {
				current = { mcpServers: {} }
			}

			if (!current.mcpServers) current.mcpServers = {}
			
			current.mcpServers['nan0web-knowledge'] = configEntry

			await fs.writeFile(ide.path, JSON.stringify(current, null, 2))
			console.log(`  \x1b[32m✔ Successfully updated config at: ${ide.path}\x1b[0m\n`)
		} catch (err) {
			console.log(`  \x1b[31m✘ Failed to update config: ${err.message}\x1b[0m`)
			console.log(`  👉 Manual config required:`)
			console.log(`\x1b[90m${JSON.stringify({ "nan0web-knowledge": configEntry }, null, 2)}\x1b[0m\n`)
		}
	}

	console.log(`\n\x1b[32m🎉 Done! Restart your IDE to enable the "nan0web-knowledge" tool.\x1b[0m`)
}

main().catch(err => {
	console.error(`\x1b[31mError: ${err.message}\x1b[0m`)
	process.exit(1)
})
