/**
 * GetSourceIntent — OLMUI Intent for retrieving specific files from the workspace or remote registry.
 */
export class GetSourceIntent extends Model {
    static alias: string;
    static UI: {
        title: string;
        icon: string;
    };
    static path: {
        help: string;
        type: string;
        required: boolean;
        positional: boolean;
    };
    static version: {
        help: string;
        type: string;
        alias: string;
        default: string;
    };
    /**
     * @param {Partial<GetSourceIntent> | Record<string, any>} [data] Initial state
     * @param {Partial<import('@nan0web/types').ModelOptions> & Record<string, any>} [options] Model options
     */
    constructor(data?: Partial<GetSourceIntent> | Record<string, any>, options?: Partial<import("@nan0web/types").ModelOptions> & Record<string, any>);
    /** @type {string} */ path: string;
    /** @type {string} */ version: string;
}
import { Model } from '@nan0web/types';
