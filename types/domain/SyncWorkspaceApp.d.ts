/**
 * SyncWorkspaceApp — command to synchronize workspace state and re-index agents.
 */
export class SyncWorkspaceApp extends ModelAsApp {
    static alias: string;
    static UI: {
        syncStarted: string;
        agentsUpdated: string;
        workflowsSynced: string;
        done: string;
    };
    /**
     * @returns {AsyncGenerator<any, any, any>}
     */
    run(): AsyncGenerator<any, any, any>;
}
import { ModelAsApp } from '@nan0web/ui-cli';
