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
export function parseBoundaries(text: string): Record<string, string>;
