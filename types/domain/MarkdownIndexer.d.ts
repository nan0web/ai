export class MarkdownIndexer {
    /**
     * @param {string} content
     * @returns {string}
     */
    static hashContent(content: string): string;
    constructor(config?: {});
    maxChars: any;
    overlap: any;
    /** @type {string|undefined} */
    workspaceRoot: string | undefined;
    /** @type {string|undefined} */
    targetProject: string | undefined;
    /**
     * @param {string} content
     * @param {Object} metadata
     * @returns {Array<{content: string, hash: string} & Object>}
     */
    chunkify(content: string, metadata?: any): Array<{
        content: string;
        hash: string;
    } & any>;
    /**
     * Scans the workspace and indexes target markdown files.
     * Yields progress objects for UI Adapters.
     * @param {import('./Embedder.js').Embedder} embedder
     */
    indexAll(embedder: import("./Embedder.js").Embedder): AsyncGenerator<{
        type: string;
        total: number;
        name?: undefined;
        files?: undefined;
        current?: undefined;
    } | {
        type: string;
        name: string;
        files: any;
        current: number;
        total: number;
    } | {
        type: string;
        current: number;
        total: number;
        name?: undefined;
        files?: undefined;
    } | {
        type: string;
        name: string;
        files: any;
        total?: undefined;
        current?: undefined;
    }, void, unknown>;
}
