import { Model } from '@nan0web/types'
import { progress, result } from '@nan0web/ui'
import { spawn } from 'node:child_process'

export class SysBuildAgent extends Model {
	static alias = 'sys:build'

	static dir = {
		type: 'string',
		help: 'Directory to build',
		default: '.',
		positional: true,
	}

	static UI = {
		starting: 'Starting system build in {dir}...',
	}

	/**
	 * @param {Partial<SysBuildAgent> | Record<string, any>} [data={}] Initial state
	 * @param {Partial<import('@nan0web/types').ModelOptions>} [options={}] Model options
	 */
	constructor(data = {}, options = {}) {
		super(data, options)
		/** @type {string} Directory to build */ this.dir
	}

	/**
	 * Wrapper for child_process.spawn to allow easier mocking in tests.
	 * @param {string} command
	 * @param {string[]} args
	 * @param {import('node:child_process').SpawnOptions} options
	 */
	spawn(command, args, options) {
		return spawn(command, args, options)
	}

	/**
	 * @returns {AsyncGenerator<import('@nan0web/ui').Intent, import('@nan0web/ui').ResultIntent, any>}
	 */
	async *run() {
		const t = this._.t
		yield progress(t(SysBuildAgent.UI.starting, { dir: this.dir }))

		const child = this.spawn('npm', ['run', 'build'], {
			cwd: this.dir,
			stdio: ['ignore', 'pipe', 'pipe'],
			shell: true,
		})

		let logs = ''
		if (child.stdout) child.stdout.setEncoding('utf-8')
		if (child.stderr) child.stderr.setEncoding('utf-8')

		// Helper to drain streams
		async function* drain(stream, prefix = '') {
			if (!stream) return
			for await (const chunk of stream) {
				logs += chunk
				const lines = chunk.split('\n')
				for (const line of lines) {
					if (line.trim()) yield progress(prefix + line.trim())
				}
			}
		}

		// Since we need to yield from inside async loops, we use yield* with a generator
		// This will process stdout then stderr. For full interleaving, we'd need a merged stream.
		if (child.stdout) yield* drain(child.stdout)
		if (child.stderr) yield* drain(child.stderr, 'ERR: ')

		return await new Promise((resolve) => {
			child.on('close', (code) => {
				if (code === 0) {
					resolve(result({ success: true, logs }))
				} else {
					resolve(result({ success: false, logs }))
				}
			})
			child.on('error', (err) => {
				logs += '\n' + err.message
				resolve(result({ success: false, logs }))
			})
		})
	}
}
