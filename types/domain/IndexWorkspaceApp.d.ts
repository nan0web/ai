/**
 * CLI Application Model for Workspace Indexing
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
        default: string;
    };
    static force: {
        help: string;
        type: string;
        alias: string;
        default: boolean;
    };
    /**
     * @param {Partial<IndexWorkspaceApp> | Record<string, any>} [data] Initial state
     * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Model options
     */
    constructor(data?: Partial<IndexWorkspaceApp> | Record<string, any>, options?: Partial<import("@nan0web/types").ModelOptions> & Record<string, any>);
    /** @type {string|null} Specific project filter to re-index */ project: string | null;
    /** @type {"docs"|"source"} Indexing scope */ scope: "docs" | "source";
    /** @type {boolean} Force re-indexing */ force: boolean;
}
import { ModelAsApp } from '@nan0web/ui-cli';
