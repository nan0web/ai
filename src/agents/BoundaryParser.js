/**
 * Parses a string containing OLMUI boundary markers into a structured file map.
 * This implementation uses manual offset/string analysis for performance,
 * avoiding Regular Expressions for large content streams.
 *
 * Format:
 * ---boundary:path/to/file.js---
 * ... content ...
 * ---boundary---
 *
 * Snippet Format (experimental):
 * ---boundary:path/to/file.js:33:3---
 * ... new 3-line replacement ...
 * ---boundary---
 *
 * @param {string} text The raw text received from the LLM or external agent.
 * @throws {Error} If a boundary is not closed or snippet constraints are violated.
 * @returns {Record<string, string>} Hash map of updated file contents.
 */
export function parseBoundaries(text) {
	/** @type {Record<string, string>} Hash map of file paths to their string contents. */
	const files = {}
	const markerStart = '---boundary:'
	const markerEnd = '---boundary---'

	let offset = 0

	while (offset < text.length) {
		const startIdx = text.indexOf(markerStart, offset)
		if (startIdx === -1) break

		// Find end of the header line
		const headerEndIdx = text.indexOf('---', startIdx + markerStart.length)
		if (headerEndIdx === -1) {
			throw new Error('Boundary header not closed with "---"')
		}

		const header = text.slice(startIdx + markerStart.length, headerEndIdx)
		// Header might be "path/to/file.js" or "path/to/file.js:startLine:lineCount"
		const parts = header.split(':')
		const filePath = parts[0].trim()

		// Content starts after the header line's trailing dashes and potential newline
		let contentStartIdx = headerEndIdx + 3 // skip '---'
		if (text[contentStartIdx] === '\r') contentStartIdx++
		if (text[contentStartIdx] === '\n') contentStartIdx++

		// Find the closing boundary
		const contentEndIdx = text.indexOf(markerEnd, contentStartIdx)
		if (contentEndIdx === -1) {
			throw new Error(`Boundary for "${filePath}" not closed with "${markerEnd}"`)
		}

		let content = text.slice(contentStartIdx, contentEndIdx)

		// Trim potential trailing newline before boundary
		if (content.endsWith('\n')) content = content.slice(0, -1)
		if (content.endsWith('\r')) content = content.slice(0, -1)

		// Snippet validation (per user request)
		if (parts.length === 3) {
			const startLine = parseInt(parts[1])
			const lineCount = parseInt(parts[2])
			const actualCount = content.split('\n').length

			// User specifically requested error if 3 lines replaced with 1 etc.
			if (actualCount !== lineCount) {
				throw new Error(
					`Snippet for "${filePath}" expects ${lineCount} lines, but got ${actualCount}`,
				)
			}
			// For now we don't handle merging, just return as is or error
			// But since the contract is Record<string, string>, returning a snippet as a file content is risky
			files[header] = content
		} else {
			files[filePath] = content
		}

		// Move offset past the closing boundary
		offset = contentEndIdx + markerEnd.length
	}

	return files
}
