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
    static ui: {
        errorModelNotFound: string;
    };
    /**
     * @param {Object} input
     * @param {readonly[string, ModelInfo] | readonly [string, ModelInfo] | Map<string, ModelInfo>} [input.models=[]]
     * @param {ModelInfo} [input.selectedModel]
     * @param {AiStrategy} [input.strategy]
     */
    constructor(input?: {
        models?: Map<string, ModelInfo> | readonly [string, ModelInfo] | undefined;
        selectedModel?: ModelInfo | undefined;
        strategy?: AiStrategy | undefined;
    });
    /** @type {ModelInfo?} */
    selectedModel: ModelInfo | null;
    strategy: AiStrategy;
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
/**
 * - mighe be available from the ModelInfo
 */
export type AiStrategyFinance = "free" | "cheap" | "expensive";
/**
 * - might be extracted from hugging_face_id
 */
export type AiStrategyVolume = "low" | "mid" | "high";
/**
 * - might be calculated by stats
 */
export type AiStrategySpeed = "slow" | "fast";
/**
 * - might be calculated by stats
 */
export type AiStrategyLevel = "simple" | "smart" | "expert";
/**
 * callbacks and abort signal
 */
export type StreamOptions = {
    /**
     * aborts the request when signaled
     */
    abortSignal?: AbortSignal | undefined;
    /**
     * called for each raw chunk
     */
    onChunk?: import("ai").StreamTextOnChunkCallback<import("ai").ToolSet> | undefined;
    /**
     * called after a logical step finishes (see description above)
     */
    onStepFinish?: import("ai").StreamTextOnStepFinishCallback<import("ai").ToolSet> | undefined;
    /**
     * called on stream error
     */
    onError?: import("ai").StreamTextOnErrorCallback | undefined;
    /**
     * called when the stream ends successfully
     */
    onFinish?: (() => void) | undefined;
    /**
     * called when the stream is aborted
     */
    onAbort?: (() => void) | undefined;
};
import { ModelInfo } from './ModelInfo.js';
/** @typedef {"free" | "cheap" | "expensive"} AiStrategyFinance - mighe be available from the ModelInfo */
/** @typedef {"low" | "mid" | "high"} AiStrategyVolume - might be extracted from hugging_face_id */
/** @typedef {"slow" | "fast"} AiStrategySpeed - might be calculated by stats */
/** @typedef {"simple" | "smart" | "expert"} AiStrategyLevel - might be calculated by stats */
/**
 * @typedef {Object} StreamOptions callbacks and abort signal
 * @property {AbortSignal} [abortSignal] aborts the request when signaled
 * @property {import('ai').StreamTextOnChunkCallback<import('ai').ToolSet>} [onChunk] called for each raw chunk
 * @property {import('ai').StreamTextOnStepFinishCallback<import('ai').ToolSet>} [onStepFinish] called after a logical step finishes (see description above)
 * @property {import('ai').StreamTextOnErrorCallback} [onError] called on stream error
 * @property {()=>void} [onFinish] called when the stream ends successfully
 * @property {()=>void} [onAbort] called when the stream is aborted
 */
declare class AiStrategy {
    static finance: {
        help: string;
        /** @type {AiStrategyFinance[]} */
        enum: AiStrategyFinance[];
        /** @type {AiStrategyFinance} */
        default: AiStrategyFinance;
    };
    static speed: {
        help: string;
        /** @type {AiStrategySpeed[]} */
        enum: AiStrategySpeed[];
        /** @type {AiStrategySpeed} */
        default: AiStrategySpeed;
    };
    static volume: {
        help: string;
        /** @type {AiStrategyVolume[]} */
        enum: AiStrategyVolume[];
        /** @type {AiStrategyVolume} */
        default: AiStrategyVolume;
    };
    /**
     * Solving issues level measured with a statistics.
     * - `simple` - more than 20% fails
     * - `smart` - equal or less than 20% fails
     * - `expert` - equal or less than 2% fails
     */
    static level: {
        help: string;
        /** @type {AiStrategyLevel[]} */
        enum: AiStrategyLevel[];
        /** @type {AiStrategyLevel} */
        default: AiStrategyLevel;
    };
    static budget: {
        help: string;
        default: number;
    };
    static rateLimitDelayMs: {
        help: string;
        default: number;
    };
    static rateLimitRetries: {
        help: string;
        default: number;
    };
    constructor(initial?: {});
    /**
     * A finance limit that is calculated by prompt, completion cost per token.
     * - `free` - for models with prompt and completion prices = 0
     * - `cheap` - for models with prompt and completion prices below medium of all available
     * - `expensive` - for models with prompt and completion prices equal and above the medium of all available
     * @type {"free" | "cheap" | "expensive"}
     */
    finance: "free" | "cheap" | "expensive";
    /**
     * The response speed.
     * - `slow` - for models with the response speed above the medium of all available
     * - `fast` - for models with the response speed below the medium of all available
     * @type {AiStrategySpeed}
     */
    speed: AiStrategySpeed;
    /**
     * The total parameters amount of the model divided into 3 medium ranges to select from: A, B, C.
     * - `low` - from 0 to billions of parameters depending on A range,
     * - `mod` - B range
     * - `high` - C range
     * @type {AiStrategyVolume}
     */
    volume: AiStrategyVolume;
    /** @type {AiStrategyLevel} */
    level: AiStrategyLevel;
    /** @type {number | string} A budget for the current chat */
    budget: number | string;
    /** @type {number} */
    rateLimitDelayMs: number;
    /** @type {number} */
    rateLimitRetries: number;
    /**
     * @param {ModelInfo} model
     * @param {number} tokens
     * @param {number} [safeAnswerTokens=1_000]
     * @returns {boolean}
     */
    shouldChangeModel(model: ModelInfo, tokens: number, safeAnswerTokens?: number): boolean;
    /**
     * @param {Map<string, ModelInfo>} models
     * @param {number} tokens
     * @param {number} [safeAnswerTokens=1_000]
     * @returns {ModelInfo | undefined}
     */
    findModel(models: Map<string, ModelInfo>, tokens: number, safeAnswerTokens?: number): ModelInfo | undefined;
}
import { Usage } from './Usage.js';
export {};
