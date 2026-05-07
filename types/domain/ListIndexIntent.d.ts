/**
 * ListIndexIntent — Intent to list individual files within workspace indices.
 * Unlike ShowIndexIntent (which shows index metadata per project),
 * this lists the actual indexed file paths inside a specific index.
 */
export class ListIndexIntent extends ModelAsApp {
    static alias: string;
    static UI: {
        title: string;
    };
    static project: {
        help: string;
        type: string;
        alias: string;
        default: null;
        positional: boolean;
    };
    static scope: {
        help: string;
        type: string;
        alias: string;
        options: string[];
        default: null;
    };
    static json: {
        help: string;
        type: string;
        default: boolean;
    };
    /**
     * @param {Partial<ListIndexIntent> | Record<string, any>} [data] Initial state
     * @param {any} [options] Model options
     */
    constructor(data?: Partial<ListIndexIntent> | Record<string, any>, options?: any);
    /** @type {string|null} */ project: string | null;
    /** @type {string|null} */ scope: string | null;
    /** @type {boolean} */ json: boolean;
    /**
     * @returns {AsyncGenerator<any, any, any>}
     */
    run(): AsyncGenerator<any, any, any>;
}
import { ModelAsApp } from '@nan0web/ui-cli';
