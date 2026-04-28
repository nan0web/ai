/**
 * CLI Application Model for Workspace Indexing.
 */
export class IndexWorkspaceApp extends ModelAsApp {
    static alias: string;
    static UI: {
        done: string;
    };
    static project: {
        help: string;
        type: string;
        alias: string;
        default: null;
    };
    static scope: {
        help: string;
        type: string;
        alias: string;
        options: string[];
    };
    static force: {
        help: string;
        type: string;
        alias: string;
        default: boolean;
    };
    static agents: {
        help: string;
        type: string;
        alias: string;
        default: boolean;
    };
    static concurrency: {
        help: string;
        type: string;
        alias: string;
        default: number;
    };
    static ignore: {
        help: string;
        type: string;
        alias: string;
        default: never[];
    };
    static sources: {
        help: string;
        type: string;
        alias: string;
        default: boolean;
    };
    static skipData: {
        help: string;
        type: string;
        alias: string;
        default: boolean;
    };
    static skipSources: {
        help: string;
        type: string;
        alias: string;
        default: boolean;
    };
    static skipDocs: {
        help: string;
        type: string;
        alias: string;
        default: boolean;
    };
    /**
     * @param {Partial<IndexWorkspaceApp> | Record<string, any>} [data] Initial state
     * @param {any} [options] Model options
     */
    constructor(data?: Partial<IndexWorkspaceApp> | Record<string, any>, options?: any);
    /** @type {string|null} */ project: string | null;
    /** @type {string[]} */ scopes: string[];
    /** @type {boolean} */ sources: boolean;
    /** @type {boolean} */ force: boolean;
    /** @type {boolean} */ agents: boolean;
    /** @type {number} */ concurrency: number;
    /** @type {boolean} */ silent: boolean;
    /** @type {string[]} */ ignore: string[];
    /**
     * @returns {AsyncGenerator<any, any, any>}
     */
    run(): AsyncGenerator<any, any, any>;
    indexFull(): AsyncGenerator<import("@nan0web/ui/types/core/Intent.js").ProgressIntent | import("@nan0web/ui/types/core/Intent.js").ShowIntent, void, unknown>;
    indexAgents(): AsyncGenerator<import("@nan0web/ui/types/core/Intent.js").ProgressIntent | import("@nan0web/ui/types/core/Intent.js").ShowIntent, void, unknown>;
}
import { ModelAsApp } from '@nan0web/ui-cli';
