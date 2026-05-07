/**
 * SearchSourcesIntent — OLMUI Intent for semantic search across workspace indices.
 */
export class SearchSourcesIntent extends ModelAsApp {
    static alias: string;
    static UI: {
        title: string;
    };
    static query: {
        help: string;
        type: string;
        required: boolean;
        positional: boolean;
    };
    static project: {
        help: string;
        type: string;
        alias: string;
        default: null;
    };
    static limit: {
        help: string;
        type: string;
        alias: string;
        default: number;
    };
    static maxDistance: {
        help: string;
        type: string;
        alias: string;
        default: number;
    };
    static scope: {
        help: string;
        type: string;
        alias: string;
        options: string[];
        default: string;
    };
    static strictSearch: {
        alias: string;
        help: string;
        type: string;
        default: boolean;
    };
    static json: {
        help: string;
        type: string;
        default: boolean;
    };
    static sources: {
        help: string;
        type: string;
        default: boolean;
    };
    /**
     * @param {Partial<SearchSourcesIntent> | Record<string, any>} [data] Initial state
     * @param {any} [options] Model options
     */
    constructor(data?: Partial<SearchSourcesIntent> | Record<string, any>, options?: any);
    /** @type {string} */ query: string;
    /** @type {string|null} */ project: string | null;
    /** @type {"docs"|"source"} */ scope: "docs" | "source";
    /** @type {number} */ limit: number;
    /** @type {number} */ maxDistance: number;
    /** @type {boolean} */ strictSearch: boolean;
    /** @type {boolean} */ json: boolean;
    /**
     * @returns {AsyncGenerator<any, any, any>}
     */
    run(): AsyncGenerator<any, any, any>;
}
import { ModelAsApp } from '@nan0web/ui-cli';
