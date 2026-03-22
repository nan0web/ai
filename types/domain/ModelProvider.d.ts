export const ProviderConfig: {};
export class ModelProvider {
    /** @type {AvailableProvider[]} */
    static AvailableProviders: AvailableProvider[];
    static ui: {
        errorApiKeyReq: string;
        errorCerebrasNotice: string;
        errorUnsupportedProvider: string;
        errorFetchFailed: string;
    };
    /**
     * Returns true if the API key for the provider is present.
     * @param {string} provider
     * @returns {boolean}
     */
    static hasApiKey(provider: string): boolean;
    /**
     * Validates API key for a provider and throws if missing.
     * @param {string} provider - Provider name (e.g., 'openai')
     * @throws {ModelError} If API key is missing, with provider-specific help.
     */
    static validateApiKey(provider: string): void;
    constructor(input?: {});
    get cachePath(): string;
    get cacheConfig(): CacheConfig;
    /**
     * Load the cache file if it exists and is fresh.
     * @param {string} provider
     * @returns {Promise<object[] | null>}
     */
    loadCache(provider: string): Promise<object[] | null>;
    /**
     * Write fresh data to the cache as JSONL (one model per line).
     * @param {any} data
     * @param {string} provider
     */
    writeCache(data: any, provider: string): Promise<void>;
    /**
     * Fetch model list from a provider endpoint.
     *
     * The function knows how to call each supported provider.
     *
     * @param {AvailableProvider} provider
     * @returns {Promise<Array<Partial<ModelInfo> & {id: string}>>} Raw model data.
     */
    fetchFromProvider(provider: AvailableProvider): Promise<Array<Partial<ModelInfo> & {
        id: string;
    }>>;
    /**
     *
     * @param {string | URL | globalThis.Request} url
     * @param {RequestInit} options
     * @returns {Promise<Response>}
     */
    fetch(url: string | URL | globalThis.Request, options: RequestInit): Promise<Response>;
    /**
     * Flatten multi-provider entries into separate ModelInfo instances.
     * @param {Array<ModelInfo & { providers?: HuggingFaceProviderInfo[] }>} arr
     * @param {AvailableProvider} provider
     * @param {Array<[string, Partial<ModelInfo>]>} [predefined]
     * @returns {ModelInfo[]}
     */
    _makeFlat(arr: Array<ModelInfo & {
        providers?: HuggingFaceProviderInfo[];
    }>, provider: AvailableProvider, predefined?: Array<[string, Partial<ModelInfo>]>): ModelInfo[];
    /**
     * Return a map of model-id → array of ModelInfo (one per provider variant).
     *
     * Attempts cache first. If stale/missing, fetches from providers, merges with static info,
     * updates cache, and returns. Errors per-provider are swallowed, falling back to static.
     *
     * @param {object} [options={}]
     * @param {function(string, string[]): void} [options.onBefore] Called before fetch.
     * @param {function(string, any, ModelInfo[]): void} [options.onData] Called after normalization.
     * @param {boolean} [options.noCache]
     * @returns {Promise<Map<string, ModelInfo>>}
     */
    getAll(options?: {
        onBefore?: ((arg0: string, arg1: string[]) => void) | undefined;
        onData?: ((arg0: string, arg1: any, arg2: ModelInfo[]) => void) | undefined;
        noCache?: boolean | undefined;
    }): Promise<Map<string, ModelInfo>>;
    /**
     * @param {Array} raw
     * @param {AvailableProvider} name
     * @returns {ModelInfo[]}
     */
    flatten(raw: any[], name: AvailableProvider): ModelInfo[];
    #private;
}
export type AvailableProvider = "cerebras" | "openrouter" | "huggingface" | "llamacpp" | "google" | "groq";
export type HuggingFaceProviderInfo = {
    provider: string;
    status: string;
    context_length: number;
    pricing: {
        input: number;
        output: number;
    };
    supports_tools: boolean;
    supports_structured_output: boolean;
    is_model_author: boolean;
};
/** @typedef {"cerebras" | "openrouter" | "huggingface" | "llamacpp" | "google" | "groq"} AvailableProvider */
/**
 * @typedef {Object} HuggingFaceProviderInfo
 * @property {string} provider
 * @property {string} status
 * @property {number} context_length
 * @property {{ input: number, output: number }} pricing
 * @property {boolean} supports_tools
 * @property {boolean} supports_structured_output
 * @property {boolean} is_model_author
 */
declare class CacheConfig {
    /** @param {Partial<CacheConfig>} [input] */
    constructor(input?: Partial<CacheConfig>);
    /** @type {number} Cache duration – 1 hour (in milliseconds) */
    ttl: number;
    file: string;
    /**
     * @param {string} provider
     * @return {string}
     */
    getFile(provider: string): string;
    /**
     * @param {number} time File change time in milliseconds
     * @param {number} [now] Now time in milliseconds
     * @returns {boolean}
     */
    isAlive(time: number, now?: number): boolean;
}
import { ModelInfo } from './ModelInfo.js';
export {};
