/**
 * ShowIndexIntent — Intent to display metadata about indexed workspace packages.
 */
export class ShowIndexIntent extends ModelAsApp {
    static alias: string;
    static UI: {
        title: string;
        icon: string;
    };
    static project: {
        help: string;
        type: string;
        alias: string;
        default: null;
        positional: boolean;
    };
    static json: {
        help: string;
        type: string;
        default: boolean;
    };
    /**
     * @param {Partial<ShowIndexIntent> | Record<string, any>} [data] Initial state
     * @param {any} [options] Model options
     */
    constructor(data?: Partial<ShowIndexIntent> | Record<string, any>, options?: any);
    /** @type {string|null} */ project: string | null;
    /** @type {boolean} */ json: boolean;
    /**
     * @returns {AsyncGenerator<any, any, any>}
     */
    run(): AsyncGenerator<any, any, any>;
}
import { ModelAsApp } from '@nan0web/ui-cli';
