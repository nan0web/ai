/**
 * StoreApp — router for store sub-commands
 */
export class StoreApp extends ModelAsApp {
    static alias: string;
    static UI: {
        title: string;
        help: string;
    };
    static action: {
        help: string;
        options: (typeof StoreList | typeof StoreAdd | typeof StoreRemove)[];
        positional: boolean;
        default: typeof StoreList;
    };
    static json: {
        help: string;
        type: string;
        default: boolean;
    };
    static jsonl: {
        help: string;
        type: string;
        default: boolean;
    };
    static csv: {
        help: string;
        type: string;
        default: boolean;
    };
    static nan0: {
        help: string;
        type: string;
        default: boolean;
    };
    static md: {
        help: string;
        type: string;
        default: boolean;
    };
    /**
     * @param {Partial<StoreApp> | Record<string, any>} [data]
     * @param {any} [options]
     */
    constructor(data?: Partial<StoreApp> | Record<string, any>, options?: any);
    /** @type {InstanceType<typeof StoreList> | InstanceType<typeof StoreAdd> | InstanceType<typeof StoreRemove>} */
    action: InstanceType<typeof StoreList> | InstanceType<typeof StoreAdd> | InstanceType<typeof StoreRemove>;
    /** @type {boolean} */ json: boolean;
    /** @type {boolean} */ jsonl: boolean;
    /** @type {boolean} */ csv: boolean;
    /** @type {boolean} */ nan0: boolean;
    /** @type {boolean} */ md: boolean;
    /**
     * @returns {AsyncGenerator<any, any, any>}
     */
    run(): AsyncGenerator<any, any, any>;
}
import { ModelAsApp } from '@nan0web/ui-cli';
/**
 * StoreList — lists projects in the store
 */
declare class StoreList extends ModelAsApp {
    static alias: string;
    static UI: {
        title: string;
        help: string;
    };
    static json: {
        help: string;
        type: string;
        default: boolean;
    };
    static jsonl: {
        help: string;
        type: string;
        default: boolean;
    };
    static csv: {
        help: string;
        type: string;
        default: boolean;
    };
    static nan0: {
        help: string;
        type: string;
        default: boolean;
    };
    static md: {
        help: string;
        type: string;
        default: boolean;
    };
    /**
     * @param {Partial<StoreList> | Record<string, any>} [data]
     * @param {any} [options]
     */
    constructor(data?: Partial<StoreList> | Record<string, any>, options?: any);
    /** @type {boolean} */ json: boolean;
    /** @type {boolean} */ jsonl: boolean;
    /** @type {boolean} */ csv: boolean;
    /** @type {boolean} */ nan0: boolean;
    /** @type {boolean} */ md: boolean;
    /**
     * @returns {AsyncGenerator<any, any, any>}
     */
    run(): AsyncGenerator<any, any, any>;
}
/**
 * StoreAdd — adds a project to the store
 */
declare class StoreAdd extends ModelAsApp {
    static alias: string;
    static UI: {
        title: string;
        help: string;
    };
    static path: {
        help: string;
        type: string;
        positional: boolean;
        default: string;
    };
    /**
     * @param {Partial<StoreAdd> | Record<string, any>} [data]
     * @param {any} [options]
     */
    constructor(data?: Partial<StoreAdd> | Record<string, any>, options?: any);
    /** @type {string} */ path: string;
    /**
     * @returns {AsyncGenerator<any, any, any>}
     */
    run(): AsyncGenerator<any, any, any>;
}
/**
 * StoreRemove — removes a project from the store
 */
declare class StoreRemove extends ModelAsApp {
    static alias: string;
    static UI: {
        title: string;
        help: string;
    };
    static nameArg: {
        help: string;
        type: string;
        positional: boolean;
        required: boolean;
    };
    /**
     * @param {Partial<StoreRemove> | Record<string, any>} [data]
     * @param {any} [options]
     */
    constructor(data?: Partial<StoreRemove> | Record<string, any>, options?: any);
    /** @type {string} */ nameArg: string;
    /**
     * @returns {AsyncGenerator<any, any, any>}
     */
    run(): AsyncGenerator<any, any, any>;
}
export {};
