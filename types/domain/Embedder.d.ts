export class Embedder {
    constructor(config?: {});
    baseURL: any;
    model: any;
    _fetch: any;
    /**
     * Computes embeddings for single or multiple inputs.
     * @param {string|string[]} input
     * @returns {Promise<number[] | number[][]>}
     */
    embed(input: string | string[]): Promise<number[] | number[][]>;
    /**
     * @param {string[]} texts
     * @returns {Promise<number[][]>}
     */
    embedBatch(texts: string[]): Promise<number[][]>;
}
