import fs from 'node:fs/promises'
import process from 'node:process'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

/** @typedef {{ role: string, content: string }} ChatMessage */

export class ChatConfig {
	model = ''
	provider = ''
	constructor(input = {}) {
		const { model = this.model, provider = this.provider } = input
		this.model = String(model)
		this.provider = String(provider)
	}
}

/**
 * Manages chat history and artifacts in the file system.
 * Migrated from legacy @nan0web/llimo.
 */
export class ChatSession {
	/** @type {string} Session ID */ id
	/** @type {string} Working directory */ cwd
	/** @type {string} Root folder for chats (relative to cwd) */ root
	/** @type {ChatMessage[]} Message history */ messages = []
	/** @type {string} Absolute path to session directory */ #dir

	/**
	 * @param {Object} [input={}]
	 * @param {string} [input.id]
	 * @param {string} [input.cwd]
	 * @param {string} [input.root='chat']
	 * @param {ChatMessage[]} [input.messages=[]]
	 */
	constructor(input = {}) {
		const { id = randomUUID(), cwd = process.cwd(), root = 'chat', messages = [] } = input
		this.id = String(id)
		this.cwd = String(cwd)
		this.root = String(root)
		this.messages = messages
		this.#dir = path.resolve(this.cwd, this.root, this.id)
	}

	get dir() {
		return this.#dir
	}

	/**
	 * Initialize session directory.
	 */
	async init() {
		await fs.mkdir(this.dir, { recursive: true })
	}

	/**
	 * Add a message to the history.
	 * @param {ChatMessage} message
	 */
	add(message) {
		this.messages.push(message)
	}

	/**
	 * Save the current state of messages to messages.jsonl.
	 */
	async save() {
		const filePath = path.join(this.dir, 'messages.jsonl')
		const content = this.messages.map((m) => JSON.stringify(m)).join('\n') + '\n'
		await fs.writeFile(filePath, content, 'utf-8')
	}

	/**
	 * Load messages from the file system.
	 */
	async load() {
		const filePath = path.join(this.dir, 'messages.jsonl')
		try {
			const content = await fs.readFile(filePath, 'utf-8')
			this.messages = content
				.split('\n')
				.filter(Boolean)
				.map((line) => JSON.parse(line))
			return true
		} catch {
			return false
		}
	}

	/**
	 * Save a specific artifact (like answer.md or prompt.md).
	 * @param {string} filename
	 * @param {string} content
	 */
	async saveArtifact(filename, content) {
		const filePath = path.join(this.dir, filename)
		await fs.mkdir(path.dirname(filePath), { recursive: true })
		await fs.writeFile(filePath, content, 'utf-8')
	}

	/**
	 * Append content to a file (useful for streaming logs).
	 * @param {string} filename
	 * @param {string} content
	 */
	async appendArtifact(filename, content) {
		const filePath = path.join(this.dir, filename)
		await fs.mkdir(path.dirname(filePath), { recursive: true })
		await fs.appendFile(filePath, content, 'utf-8')
	}
}
