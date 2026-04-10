/**
 * CnaiRefactorAgent — performs code refactoring using LLM and OLMUI boundaries.
 */
export class CnaiRefactorAgent extends Model {
    static alias: string;
    static files: {
        help: string;
        default: {};
    };
    static instructions: {
        help: string;
        default: string;
    };
    /**
     * @param {Object} [data] Initial state
     * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Options
     */
    constructor(data?: any, options?: Partial<import("@nan0web/types").ModelOptions> & Record<string, any>);
    /** @type {Record<string, string>} Files to refactor */ files: Record<string, string>;
    /** @type {string} Instructions for refactoring */ instructions: string;
    /**
     * Runs the refactoring task.
     * @returns {AsyncGenerator<any, any, any>}
     */
    run(): AsyncGenerator<any, any, any>;
    /**
     * Builds the system-style prompt for the LLM.
     * @returns {string}
     */
    toPrompt(): string;
}
import { Model } from '@nan0web/types';
