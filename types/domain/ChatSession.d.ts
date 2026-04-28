/** @typedef {{ role: string, content: string }} ChatMessage */
export class ChatConfig {
    constructor(input?: {});
    model: string;
    provider: string;
}
/**
 * Manages chat history and artifacts in the file system.
 * Migrated from legacy @nan0web/llimo.
 */
export class ChatSession {
    /**
     * @param {Object} [input={}]
     * @param {string} [input.id]
     * @param {string} [input.cwd]
     * @param {string} [input.root='chat']
     * @param {ChatMessage[]} [input.messages=[]]
     */
    constructor(input?: {
        id?: string | undefined;
        cwd?: string | undefined;
        root?: string | undefined;
        messages?: ChatMessage[] | undefined;
    });
    /** @type {string} Session ID */ id: string;
    /** @type {string} Working directory */ cwd: string;
    /** @type {string} Root folder for chats (relative to cwd) */ root: string;
    /** @type {ChatMessage[]} Message history */ messages: ChatMessage[];
    get dir(): string;
    /**
     * Initialize session directory.
     */
    init(): Promise<void>;
    /**
     * Add a message to the history.
     * @param {ChatMessage} message
     */
    add(message: ChatMessage): void;
    /**
     * Save the current state of messages to messages.jsonl.
     */
    save(): Promise<void>;
    /**
     * Load messages from the file system.
     */
    load(): Promise<boolean>;
    /**
     * Save a specific artifact (like answer.md or prompt.md).
     * @param {string} filename
     * @param {string} content
     */
    saveArtifact(filename: string, content: string): Promise<void>;
    /**
     * Append content to a file (useful for streaming logs).
     * @param {string} filename
     * @param {string} content
     */
    appendArtifact(filename: string, content: string): Promise<void>;
    #private;
}
export type ChatMessage = {
    role: string;
    content: string;
};
