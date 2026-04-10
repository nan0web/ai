/**
 * VectorDB — HNSW vector index with metadata storage.
 * Inherits from Model to follow Model-as-Schema v2.
 *
 * Uses `this._.db` for file persistence (save/load).
 * If no db is injected, falls back to direct node:fs/promises.
 */
export class VectorDB extends Model {
    static UI: {
        errorDimensionMismatch: string;
    };
    static dim: {
        help: string;
        default: number;
    };
    static space: {
        help: string;
        default: string;
        options: string[];
    };
    static maxElements: {
        help: string;
        default: number;
    };
    /**
     * @param {Partial<VectorDB> | Record<string, any>} [data] Initial state
     * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
     */
    constructor(data?: Partial<VectorDB> | Record<string, any>, options?: Partial<import("@nan0web/types").ModelOptions>);
    /** @type {number} Embedding vector dimension */ dim: number;
    /** @type {string} Distance metric to use */ space: string;
    /** @type {number} Max element capacity */ maxElements: number;
    /** @type {hnswlib.HierarchicalNSW} Native HNSW index instance */
    _index: hnswlib.HierarchicalNSW;
    /** @type {Map<number, object>} ID to metadata mapping */
    _metadata: Map<number, object>;
    /** @type {number} Auto-incrementing index ID */
    _nextId: number;
    /**
     * @param {number[] | Float32Array} vector
     * @param {object} [meta]
     * @returns {number}
     */
    addVector(vector: number[] | Float32Array, meta?: object): number;
    /**
     * @param {number[] | Float32Array} vector
     * @param {number} [k]
     * @returns {Array<object & { id: number, distance: number }>}
     */
    search(vector: number[] | Float32Array, k?: number): Array<object & {
        id: number;
        distance: number;
    }>;
    /**
     * Persists the HNSW index and metadata to disk.
     * Uses `this._.db` if injected, otherwise falls back to `node:fs/promises`.
     * @param {string} filePath
     */
    save(filePath: string): Promise<void>;
    /**
     * Loads a previously persisted HNSW index and metadata from disk.
     * @param {string} filePath
     * @returns {Promise<boolean>}
     */
    load(filePath: string): Promise<boolean>;
}
import { Model } from '@nan0web/types';
import hnswlib from 'hnswlib-node';
