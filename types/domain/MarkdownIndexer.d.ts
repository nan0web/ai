export class MarkdownIndexer {
    constructor(config?: {});
    maxChars: any;
    overlap: any;
    /**
     * @param {string} markdown
     * @param {Object} metadata
     * @returns {Array<{content: string} & Object>}
     */
    chunkify(markdown: string, metadata?: any): Array<{
        content: string;
    } & any>;
}
