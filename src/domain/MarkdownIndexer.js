export class MarkdownIndexer {
	constructor(config = {}) {
		this.maxChars = config.maxChars || 3000
		this.overlap = config.overlap || 200
	}

	/**
	 * @param {string} markdown
	 * @param {Object} metadata
	 * @returns {Array<{content: string} & Object>}
	 */
	chunkify(markdown, metadata = {}) {
		// Split primarily by headers H2 and H3
		const sections = markdown.split(/\n(?=#{2,3} )/)
		const chunks = []

		for (const section of sections) {
			if (!section.trim()) continue

			// If section is reasonably sized, keep it
			if (section.length <= this.maxChars) {
				chunks.push({ content: section.trim(), ...metadata })
				continue
			}

			// If section is too big, split by double newline (paragraphs) for sub-chunking
			const paragraphs = section.split(/\n\n/)
			let currentChunk = ''

			for (const p of paragraphs) {
				if (currentChunk.length + p.length > this.maxChars && currentChunk.length > 0) {
					chunks.push({ content: currentChunk.trim(), ...metadata })
					// Simple overlap: take the last ~overlap characters from currentChunk
					const overlapStr =
						currentChunk.length > this.overlap ? currentChunk.slice(-this.overlap) : currentChunk
					currentChunk = '... ' + overlapStr + '\n\n' + p
				} else {
					currentChunk += (currentChunk ? '\n\n' : '') + p
				}
			}
			if (currentChunk.trim().length > 0) {
				chunks.push({ content: currentChunk.trim(), ...metadata })
			}
		}

		return chunks
	}
}
