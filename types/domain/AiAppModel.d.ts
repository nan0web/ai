/**
 * AiAppModel — domain model for AI toolkit management (RAG, Indexing, MCP).
 * Follows Model-as-Schema v2 and OLMUI patterns.
 */
export class AiAppModel extends ModelAsApp {
    static UI: {
        indexingStarted: string;
        projectIndexed: string;
        projectCached: string;
        scanningFiles: string;
        embeddingChunks: string;
        searchQuery: string;
        noResults: string;
        mcpSuccess: string;
        emptyQuery: string;
        error: string;
    };
    static command: {
        help: string;
        options: (typeof GetSourceIntent | typeof SearchSourcesIntent | typeof IndexWorkspaceApp)[];
        positional: boolean;
    };
    /**
     * @param {Partial<AiAppModel> | Record<string, any>} [data] Initial state
     * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Model options
     */
    constructor(data?: Partial<AiAppModel> | Record<string, any>, options?: Partial<import("@nan0web/types").ModelOptions> & Record<string, any>);
    /** @type {IndexWorkspaceApp|SearchSourcesIntent|null} */ command: IndexWorkspaceApp | SearchSourcesIntent | null;
    run(): AsyncGenerator<import("@nan0web/ui/types/core/Intent.js").ProgressIntent | import("@nan0web/ui/types/core/Intent.js").ResultIntent | import("@nan0web/ui/types/core/Intent.js").ShowIntent, void, unknown>;
    /**
     * Rename original index to indexFull to avoid property name collision
     */
    indexFull(opts?: {}, force?: boolean): AsyncGenerator<import("@nan0web/ui/types/core/Intent.js").ProgressIntent | import("@nan0web/ui/types/core/Intent.js").ShowIntent, void, unknown>;
    /**
     * Rename original search to searchMethod
     */
    searchMethod(query: any, opts?: {}): AsyncGenerator<import("@nan0web/ui/types/core/Intent.js").ResultIntent | import("@nan0web/ui/types/core/Intent.js").ShowIntent, void, unknown>;
    /**
     * Retrieve a specific file by path or package identifier.
     * @param {string} filePath
     * @param {string} [version='latest']
     */
    getMethod(filePath: string, version?: string): AsyncGenerator<import("@nan0web/ui/types/core/Intent.js").ResultIntent | import("@nan0web/ui/types/core/Intent.js").ShowIntent, void, unknown>;
    /**
     * Returns the global dataset directory path for the current workspace.
     * @returns {string}
     */
    getDatasetDir(): string;
    /**
     * @param {number[]} vec
     * @param {{ k: number, maxDistance: number, targetProject: string | null, scope: string }} opts
     * @returns {Promise<any[]>}
     */
    internalSearch(vec: number[], { k, maxDistance, targetProject, scope }: {
        k: number;
        maxDistance: number;
        targetProject: string | null;
        scope: string;
    }): Promise<any[]>;
}
export default AiAppModel;
import { ModelAsApp } from '@nan0web/ui-cli';
import { IndexWorkspaceApp } from './IndexWorkspaceApp.js';
import { SearchSourcesIntent } from './SearchSourcesIntent.js';
import { GetSourceIntent } from './GetSourceIntent.js';
