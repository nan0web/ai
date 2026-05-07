/**
 * AiAppModel — domain model for AI toolkit management (RAG, Indexing, MCP).
 */
export class AiAppModel extends ModelAsApp {
    static alias: string;
    static UI: {
        title: string;
        emptyQuery: string;
    };
    static command: {
        help: string;
        options: (typeof GetSourceIntent | typeof SearchSourcesIntent | typeof IndexWorkspaceApp | typeof SyncWorkspaceApp | typeof StoreApp | typeof ListIndexIntent)[];
        positional: boolean;
    };
    /**
     * @param {Partial<AiAppModel> | Record<string, any>} [data] Initial state
     * @param {import('@nan0web/ui').ModelAsAppOptions & Record<string, any>} [options] Model options
     */
    constructor(data?: Partial<AiAppModel> | Record<string, any>, options?: import("@nan0web/ui").ModelAsAppOptions & Record<string, any>);
    /** @type {InstanceType<typeof IndexWorkspaceApp> | InstanceType<typeof SyncWorkspaceApp> | InstanceType<typeof StoreApp> | SearchSourcesIntent | GetSourceIntent} */
    command: InstanceType<typeof IndexWorkspaceApp> | InstanceType<typeof SyncWorkspaceApp> | InstanceType<typeof StoreApp> | SearchSourcesIntent | GetSourceIntent;
    /**
     * Main execution entry point for AiAppModel.
     * Acts as a router, delegating execution to the appropriate subcommand (Executor).
     * @returns {AsyncGenerator<any, any, any>}
     */
    run(): AsyncGenerator<any, any, any>;
    /**
     * Internal search for RAG and programmatic usage.
     * @param {number[] | Float32Array} vector
     * @param {object} [opts]
     * @returns {Promise<Array<any>>}
     */
    internalSearch(vector: number[] | Float32Array, opts?: object): Promise<Array<any>>;
}
import { ModelAsApp } from '@nan0web/ui-cli';
import { IndexWorkspaceApp } from './IndexWorkspaceApp.js';
import { SyncWorkspaceApp } from './SyncWorkspaceApp.js';
import { StoreApp } from './StoreApp.js';
import { SearchSourcesIntent } from './SearchSourcesIntent.js';
import { GetSourceIntent } from './GetSourceIntent.js';
import { ListIndexIntent } from './ListIndexIntent.js';
