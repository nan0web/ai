/**
 * AgentOrchestrator — manages and executes subagents based on intent.
 */
export class AgentOrchestrator extends Model {
    static agents: {
        [SysBuildAgent.alias]: typeof SysBuildAgent;
        'cnai:refactor': typeof CnaiRefactorAgent;
    };
    static intent: {
        help: string;
        default: {};
    };
    /**
     * @param {Object} [data] Initial state
     * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Options
     */
    constructor(data?: any, options?: Partial<import("@nan0web/types").ModelOptions> & Record<string, any>);
    /** @type {any} Intent object with task and context */ intent: any;
    /**
     * Executes the requested agent task.
     * @returns {AsyncGenerator<any, any, any>}
     */
    run(): AsyncGenerator<any, any, any>;
}
import { Model } from '@nan0web/types';
import { SysBuildAgent } from './SysBuildAgent.js';
import { CnaiRefactorAgent } from './CnaiRefactorAgent.js';
