/**
 * @typedef {Object} ChunkHashEntry
 * @property {string[]} hashes Array of chunk checksums for a specific file
 */
export class IndexCacheModel extends Model {
    static entries: {
        help: string;
        type: string;
        default: {};
    };
    /**
     * @param {Partial<IndexCacheModel> | Record<string, any>} [data] Initial state
     * @param {Partial<import('@nan0web/types').ModelOptions>} [options] Model options
     */
    constructor(data?: Partial<IndexCacheModel> | Record<string, any>, options?: Partial<import("@nan0web/types").ModelOptions>);
    /** @type {Record<string, string[]>} Map of path to chunk checksums */
    entries: Record<string, string[]>;
    /**
     * Retrieves the array of text hashes for a given file.
     * @param {string} filePath
     * @returns {string[]}
     */
    getHashes(filePath: string): string[];
    /**
     * Stores the array of text hashes for a given file.
     * @param {string} filePath
     * @param {string[]} hashes
     */
    setHashes(filePath: string, hashes: string[]): void;
    /**
     * Compares a new set of hashes with the cached set to determine if the file needs re-indexing.
     * @param {string} filePath
     * @param {string[]} newHashes
     * @returns {boolean} true if unchanged, false if needs re-indexing
     */
    isUnchanged(filePath: string, newHashes: string[]): boolean;
}
export type ChunkHashEntry = {
    /**
     * Array of chunk checksums for a specific file
     */
    hashes: string[];
};
import { Model } from '@nan0web/types';
