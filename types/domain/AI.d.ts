/** @typedef {"free" | "cheap" | "expensive"} AiStrategyFinance */
/** @typedef {"low" | "mid" | "high"} AiStrategyVolume */
/** @typedef {"slow" | "fast"} AiStrategySpeed */
/** @typedef {"simple" | "smart" | "expert"} AiStrategyLevel */
/**
 * @typedef {Object} StreamOptions callbacks and abort signal
 * @property {AbortSignal} [abortSignal] aborts the request when signaled
 * @property {import('ai').StreamTextOnChunkCallback<import('ai').ToolSet>} [onChunk]
 * @property {import('ai').StreamTextOnStepFinishCallback<import('ai').ToolSet>} [onStepFinish]
 * @property {import('ai').StreamTextOnErrorCallback} [onError]
 * @property {()=>void} [onFinish]
 * @property {()=>void} [onAbort]
 */
/**
 * Wrapper for AI providers.
 *
 * Apart from the static model list, the class now exposes a method
 * `refreshModels()` that pulls the latest info from each provider (via
 * `api/models/`) and caches the result for one hour.
 *
 * @class
 */
export class AI {
    static Strategy: typeof AiStrategy;
    static UI: {
        errorModelNotFound: string;
    };
    /**
     * @param {Object} input
     * @param {readonly[string, ModelInfo] | readonly [string, ModelInfo] | Map<string, ModelInfo>} [input.models=[]] List of available models
     * @param {ModelInfo} [input.selectedModel] Currently selected model
     * @param {AiStrategy} [input.strategy] Selection and fallback strategy
     */
    constructor(input?: {
        models?: Map<string, ModelInfo> | readonly [string, ModelInfo] | undefined;
        selectedModel?: ModelInfo | undefined;
        strategy?: AiStrategy | undefined;
    });
    /** @type {ModelInfo?} */
    selectedModel: ModelInfo | null;
    /** @type {AiStrategy} Active strategy */ strategy: AiStrategy;
    /**
     * Flatten and normalize models to Map<string, ModelInfo[]>. Handles:
     * - Map: Pass-through.
     * - Array<[string, ModelInfo[]]>: Direct set.
     * - Array<[string, ModelInfo]>: Wrap singles in arrays.
     * - Nested providers (e.g., {providers: [{provider:'a'}]}): Expand to prefixed IDs (e.g., 'model:a').
     * @param {readonly[string, ModelInfo] | readonly [string, ModelInfo] | Map<string, ModelInfo> | readonly[string, Partial<ModelInfo> & {providers?: {provider: string}[]}]} models
     */
    setModels(models: readonly [string, ModelInfo] | readonly [string, ModelInfo] | Map<string, ModelInfo> | readonly [string, Partial<ModelInfo> & {
        providers?: {
            provider: string;
        }[];
    }]): void;
    /**
     * Refresh model information from remote providers.
     *
     * The method updates the internal `#models` map with the merged static +
     * remote data. It respects the cache (see `ModelProvider`).
     *
     * @returns {Promise<void>}
     */
    refreshModels(): Promise<void>;
    /**
     * Мультиплікативна Скоринг-Матриця.
     *
     * Кожен критерій повертає множник (0.0 - 2.0).
     * Якщо ХОЧА Б ОДИН множник = 0 → фінальний score = 0 (модель відкидається).
     * Це замінює купу if/return 0 на єдину формулу.
     *
     * @param {ModelInfo} model
     * @param {number} estimatedTokens
     * @returns {number} The computed score. Returns 0 if it does not meet critical requirements.
     */
    computeModelScore(model: ModelInfo, estimatedTokens: number): number;
    /**
     * Builds a queue of fallback models sorted by their score.
     * @param {number} estimatedTokens
     * @param {Set<string>} [triedModels] Optional set of already tried model ids
     * @returns {ModelInfo[]} Sorted array of valid fallback models
     */
    buildFallbackQueue(estimatedTokens?: number, triedModels?: Set<string>): ModelInfo[];
    /**
     * Get list of available models (after optional refresh).
     *
     * @returns {ModelInfo[]}
     */
    getModels(): ModelInfo[];
    /**
     *
     * @returns {Map<string, ModelInfo>}
     */
    getModelsMap(): Map<string, ModelInfo>;
    /**
     * Get model info by ID.
     *
     * @param {string} modelId
     * @returns {ModelInfo[]}
     */
    getModel(modelId: string): ModelInfo[];
    /**
     * Returns the model for the specific provider with absolute equality.
     * @param {string} model
     * @param {string} provider
     * @returns {ModelInfo | undefined}
     */
    getProviderModel(model: string, provider: string): ModelInfo | undefined;
    /**
     * Find a model from all of the models by partial comparasion.
     * @param {string} modelId The full or partial model id.
     * @returns {ModelInfo | undefined}
     */
    findModel(modelId: string): ModelInfo | undefined;
    /**
     * Find models that matches modelId from all of the models by partial comparasion.
     * @param {string} modelId The full or partial model id.
     * @returns {ModelInfo[]}
     */
    findModels(modelId: string): ModelInfo[];
    /**
     * Add a model to the internal map (for testing).
     *
     * @param {string} id
     * @param {Partial<ModelInfo>} info
     */
    addModel(id: string, info: Partial<ModelInfo>): void;
    /**
     * Get provider instance for a model.
     *
     * @param {string} provider
     * @returns {Promise<any>}
     */
    getProvider(provider: string): Promise<any>;
    /**
     * Stream text from a model.
     *
     * The method forwards the call to `ai.streamText` while providing a set of
     * optional hooks that can be used by monitor or control the streaming
     * lifecycle.
     *
     * @param {ModelInfo} model
     * @param {import('ai').ModelMessage[]} messages
    /**
     * Stream text from a model.
     *
     * @param {ModelInfo} model
     * @param {import('ai').ModelMessage[]} messages
     * @param {import('ai').UIMessageStreamOptions<import('ai').UIMessage> & StreamOptions & { tools?: import('ai').ToolSet, maxSteps?: number, system?: string }} [options={}]
     * @returns {Promise<import('ai').StreamTextResult<import('ai').ToolSet, any>>}
     */
    streamText(model: ModelInfo, messages: import("ai").ModelMessage[], options?: import("ai").UIMessageStreamOptions<import("ai").UIMessage> & StreamOptions & {
        tools?: import("ai").ToolSet;
        maxSteps?: number;
        system?: string;
    }): Promise<import("ai").StreamTextResult<import("ai").ToolSet, any>>;
    generateText(model: any, messages: any, options?: {}): Promise<{
        text: string;
        usage: Usage;
        usedModel: any;
        usedProvider: any;
    }>;
    /**
     * @throws {Error} When no correspondent model found.
     * @param {ModelInfo} model
     * @param {number} tokens
     * @param {number} [safeAnswerTokens=1_000]
     * @returns {ModelInfo | undefined}
     */
    ensureModel(model: ModelInfo, tokens: number, safeAnswerTokens?: number): ModelInfo | undefined;
    #private;
}
export type AiStrategyFinance = "free" | "cheap" | "expensive";
export type AiStrategyVolume = "low" | "mid" | "high";
export type AiStrategySpeed = "slow" | "fast";
export type AiStrategyLevel = "simple" | "smart" | "expert";
/**
 * callbacks and abort signal
 */
export type StreamOptions = {
    /**
     * aborts the request when signaled
     */
    abortSignal?: AbortSignal | undefined;
    onChunk?: import("ai").StreamTextOnChunkCallback<import("ai").ToolSet> | undefined;
    onStepFinish?: import("ai").StreamTextOnStepFinishCallback<import("ai").ToolSet> | undefined;
    onError?: import("ai").StreamTextOnErrorCallback | undefined;
    onFinish?: (() => void) | undefined;
    onAbort?: (() => void) | undefined;
};
import { ModelInfo } from './ModelInfo.js';
import { AiStrategy } from './AiStrategy.js';
import { Usage } from './Usage.js';
