/**
 * MarkdownIndexer — індексатор робочого простору.
 * Тепер працює виключно через this._.db з рекурсивним обходом.
 */
export class MarkdownIndexer extends Model {
    static maxChars: {
        default: number;
    };
    static overlap: {
        default: number;
    };
    static targetProject: {
        default: null;
    };
    static DEFAULT_SCOPE: string;
    /**
     * @param {string} content
     * @returns {string}
     */
    static hashContent(content: string): string;
    /**
     * @param {object} [data]
     * @param {string} [data.scope='docs'] Indexing scope ('docs' or 'source')
     * @param {string} [data.targetProject] Optional project filter
     * @param {Partial<import('@nan0web/types').ModelOptions>} [options]
     */
    constructor(data?: {
        scope?: string | undefined;
        targetProject?: string | undefined;
    }, options?: Partial<import("@nan0web/types").ModelOptions>);
    /** @type {number} */ maxChars: number;
    /** @type {number} */ overlap: number;
    /** @type {'docs'|'source'} */ scope: "docs" | "source";
    /** @type {string|null} */ targetProject: string | null;
    /**
     * Рекурсивний обхід директорій через listDir
     * @param {string} uri
     * @returns {Promise<string[]>}
     */
    scanRecursive(dir: any): Promise<string[]>;
    /**
     * @param {string} content
     * @param {Object} metadata
     * @returns {Array<{content: string, hash: string} & Object>}
     */
    chunkify(content: string, metadata?: any): Array<{
        content: string;
        hash: string;
    } & any>;
    getDatasetDir(): string;
    /**
     * Scans the workspace and indexes target markdown files.
     * @param {import('./Embedder.js').Embedder} embedder
     */
    indexAll(embedder: import("./Embedder.js").Embedder, opts?: {
        force: boolean;
    }): AsyncGenerator<{
        type: string;
        total: number;
        current?: undefined;
        phase?: undefined;
        file?: undefined;
        project?: undefined;
        name?: undefined;
        dir?: undefined;
        files?: undefined;
    } | {
        type: string;
        current: number;
        total: number;
        phase: string;
        file: string;
        project: any;
        name?: undefined;
        dir?: undefined;
        files?: undefined;
    } | {
        type: string;
        name: any;
        dir: any;
        files: any;
        current: number;
        total: number;
        phase: string;
        file?: undefined;
        project?: undefined;
    } | {
        type: string;
        name: any;
        dir: any;
        files: any;
        current: number;
        total: number;
        phase?: undefined;
        file?: undefined;
        project?: undefined;
    }, void, unknown>;
}
import { Model } from '@nan0web/types';
