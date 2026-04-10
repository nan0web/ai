/**
 * AiAppModel — domain model for AI toolkit management (RAG, Indexing, MCP).
 * Follows Model-as-Schema v2 and OLMUI patterns.
 */
export class AiAppModel extends Model {
    static UI: {
        indexingStarted: string;
        projectIndexed: string;
        projectCached: string;
        scanningFiles: string;
        embeddingChunks: string;
        searchQuery: string;
        noResults: string;
        mcpSuccess: string;
        error: string;
    };
    static query: {
        help: string;
        default: string;
        validate: (val: any) => true | "Query cannot be empty";
    };
    static project: {
        help: string;
        default: null;
    };
    /**
     * @param {Partial<AiAppModel> | Record<string, any>} [data] Initial state
     * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Model options
     */
    constructor(data?: Partial<AiAppModel> | Record<string, any>, options?: Partial<import("@nan0web/types").ModelOptions> & Record<string, any>);
    /** @type {string} Semantic search query */ query: string;
    /** @type {string|null} Specific project filter */ project: string | null;
    /**
     * Generator method for indexing (OLMUI Pattern)
     * @param {Object} opts
     * @param {string} [opts.targetProject]
     */
    index(opts?: {
        targetProject?: string | undefined;
    }): AsyncGenerator<{
        type: string;
        message: any;
        current: number;
        total: number;
        label?: undefined;
        $project?: undefined;
    } | {
        type: string;
        label: string;
        total: number | undefined;
        current: number | undefined;
        message: any;
        $project?: undefined;
    } | {
        type: string;
        message: any;
        $project: string | undefined;
        current?: undefined;
        total?: undefined;
        label?: undefined;
    }, void, unknown>;
    /**
     * Generator method for search (OLMUI Pattern)
     * @param {string} query
     * @param {Object} opts
     * @param {number} [opts.k]
     * @param {number} [opts.maxDistance]
     * @param {string} [opts.targetProject]
     */
    search(query: string, opts?: {
        k?: number | undefined;
        maxDistance?: number | undefined;
        targetProject?: string | undefined;
    }): AsyncGenerator<{
        type: string;
        message: string;
        $query: string;
        $url: any;
        data?: undefined;
    } | {
        type: string;
        message: string;
        $query?: undefined;
        $url?: undefined;
        data?: undefined;
    } | {
        type: string;
        data: any[];
        message?: undefined;
        $query?: undefined;
        $url?: undefined;
    }, void, unknown>;
    #private;
}
import { Model } from '@nan0web/types';
