/**
 * CLI Application Model for Workspace Indexing
 */
export class IndexWorkspaceApp extends Model {
    static UI: {
        done: string;
    };
    static project: {
        help: string;
        type: string;
        alias: string;
        default: null;
    };
    /**
     * @param {Partial<IndexWorkspaceApp> | Record<string, any>} [data] Initial state
     * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Model options
     */
    constructor(data?: Partial<IndexWorkspaceApp> | Record<string, any>, options?: Partial<import("@nan0web/types").ModelOptions> & Record<string, any>);
    /** @type {string|null} Specific project filter to re-index */ project: string | null;
    run(): AsyncGenerator<{
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
    } | {
        type: string;
        message: any;
    }, void, unknown>;
}
import { Model } from '@nan0web/types';
