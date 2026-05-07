/** @typedef {'data' | 'docs' | 'source'} IndexerScope */
export class MarkdownIndexer extends Model {
    static maxChars: {
        default: number;
    };
    static overlap: {
        default: number;
    };
    static scope: {
        default: string;
    };
    static targetProject: {
        default: string;
    };
    static targetDir: {
        default: string;
    };
    static ignore: {
        default: never[];
        type: string;
    };
    static UI: {
        scanning: string;
    };
    /**
     * @param {string} content
     * @returns {string}
     */
    static hashContent(content: string): string;
    /**
     * @param {object} [data]
     * @param {IndexerScope} [data.scope='docs'] Indexing scope ('docs' or 'source')
     * @param {string} [data.targetProject] Optional project filter
     * @param {string[]} [data.ignore] Directories to ignore
     * @param {Partial<import('@nan0web/types').ModelOptions>} [options]
     */
    constructor(data?: {
        scope?: IndexerScope | undefined;
        targetProject?: string | undefined;
        ignore?: string[] | undefined;
    }, options?: Partial<import("@nan0web/types").ModelOptions>);
    /** @type {number} Maximum chars per chunk */ maxChars: number;
    /** @type {number} Overlap length per chunk */ overlap: number;
    /** @type {IndexerScope} Indexer scope */ scope: IndexerScope;
    /** @type {string} Target project */ targetProject: string;
    /** @type {string} Target directory  */ targetDir: string;
    /** @type {string[]} Paths to ignore */ ignore: string[];
    /**
     * Рекурсивний обхід директорій з фільтрацією за областю видимості (docs/source)
     * @param {string} dir Поточна директорія
     * @param {string} [baseDir] Базова директорія проекту для розрахунку відносних шляхів
     * @returns {Promise<string[]>}
     */
    scanRecursive(dir: string, baseDir?: string): Promise<string[]>;
    /**
     * @param {string} content
     * @param {Object} metadata
     * @returns {Array<{content: string, hash: string} & Object>}
     */
    chunkify(content: string, metadata?: any): Array<{
        content: string;
        hash: string;
    } & any>;
    getWorkspaceRoot(): string;
    getDatasetDir(): string;
    /**
     * Scans the workspace and indexes target markdown files.
     * @param {import('./Embedder.js').Embedder} embedder
     */
    indexAll(embedder: import("./Embedder.js").Embedder, opts?: {
        force: boolean;
    }): AsyncGenerator<any, void, unknown>;
    /**
     * Searches across all indexed projects in the workspace.
     * @param {string} query
     * @param {Object} opts
     * @param {number} [opts.limit=10]
     * @param {boolean} [opts.strict=false]
     * @param {number} [opts.maxDistance=0.18]
     * @param {string} [opts.project]
     */
    search(query: string, opts?: {
        limit?: number | undefined;
        strict?: boolean | undefined;
        maxDistance?: number | undefined;
        project?: string | undefined;
    }): Promise<any[]>;
}
export type IndexerScope = "data" | "docs" | "source";
import { Model } from '@nan0web/types';
