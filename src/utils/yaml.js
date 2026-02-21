/**
 * Minimal YAML parser and serializer for simple key-value structures.
 *
 * Supports flat and shallow-nested YAML commonly found in TAP diagnostics
 * and Markdown front-matter.  This intentionally avoids pulling in the
 * full `yaml` npm package, keeping the package zero-dependency.
 *
 * @module utils/yaml
 */

/**
 * Parse a simple YAML string into a plain object.
 *
 * Handles:
 * - `key: value` pairs (string, number, boolean, null)
 * - Unquoted, single-quoted and double-quoted values
 * - Multi-line `|` and `>` block scalars (basic support)
 * - Nested objects (one level deep via indentation)
 * - Array items (`- value`)
 *
 * @param {string} text Raw YAML text.
 * @returns {Record<string, any> | null}
 */
export function parseYaml(text) {
	if (!text || !text.trim()) return null
	const lines = text.split('\n')
	return parseLines(lines, 0).value
}

/**
 * @param {string[]} lines
 * @param {number} baseIndent
 * @returns {{ value: Record<string, any>, consumed: number }}
 */
function parseLines(lines, baseIndent) {
	/** @type {Record<string, any>} */
	const result = {}
	let i = 0
	/** @type {string | null} */
	let blockKey = null
	/** @type {string} */
	let blockStyle = ''
	/** @type {string[]} */
	let blockLines = []
	let blockIndent = -1

	const flushBlock = () => {
		if (blockKey !== null) {
			const joined = blockStyle === '>' ? blockLines.join(' ').trim() : blockLines.join('\n')
			result[blockKey] = joined
			blockKey = null
			blockLines = []
			blockIndent = -1
		}
	}

	while (i < lines.length) {
		const line = lines[i]
		const stripped = line.trimEnd()
		const indent = stripped.length - stripped.trimStart().length

		// Skip empty lines inside block scalars
		if (blockKey !== null) {
			if (stripped === '' || indent > baseIndent) {
				if (blockIndent < 0 && stripped !== '') {
					blockIndent = indent
				}
				blockLines.push(stripped.slice(blockIndent < 0 ? indent : blockIndent))
				i++
				continue
			}
			flushBlock()
		}

		if (indent < baseIndent) break
		if (stripped === '' || stripped.startsWith('#')) {
			i++
			continue
		}

		const content = stripped.slice(baseIndent)
		const colonIdx = content.indexOf(':')

		// Array item  – `- value`
		if (content.startsWith('- ')) {
			// Collect all sibling array items
			const arr = []
			while (i < lines.length) {
				const l = lines[i]
				const s = l.trimEnd()
				const ci = s.slice(baseIndent)
				if (!ci.startsWith('- ')) break
				arr.push(castValue(ci.slice(2).trim()))
				i++
			}
			return { value: arr, consumed: i }
		}

		if (colonIdx < 0) {
			i++
			continue
		}

		const key = content.slice(0, colonIdx).trim()
		const rawValue = content.slice(colonIdx + 1).trim()

		// Block scalar indicators
		if (rawValue === '|' || rawValue === '>') {
			blockKey = key
			blockStyle = rawValue
			blockLines = []
			blockIndent = -1
			i++
			continue
		}

		// Nested object (value is empty, next line is indented)
		if (rawValue === '' && i + 1 < lines.length) {
			const nextLine = lines[i + 1]
			const nextIndent = nextLine.length - nextLine.trimStart().length
			if (nextIndent > baseIndent) {
				const sub = parseLines(lines.slice(i + 1), nextIndent)
				result[key] = sub.value
				i += 1 + sub.consumed
				continue
			}
		}

		result[key] = castValue(rawValue)
		i++
	}
	flushBlock()
	return { value: result, consumed: i }
}

/**
 * Cast a raw YAML string value to its JS type.
 *
 * @param {string} raw
 * @returns {string | number | boolean | null}
 */
function castValue(raw) {
	if (raw === 'null' || raw === '~' || raw === '') return null
	if (raw === 'true') return true
	if (raw === 'false') return false

	// Quoted strings
	if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
		return raw.slice(1, -1)
	}

	// Flow sequence: [1, 2, 3]
	if (raw.startsWith('[') && raw.endsWith(']')) {
		const inner = raw.slice(1, -1).trim()
		if (inner === '') return []
		return inner.split(',').map((s) => castValue(s.trim()))
	}

	// Numbers
	const num = Number(raw)
	if (!Number.isNaN(num) && raw !== '') return num

	return raw
}

/**
 * Serialize a plain object to a simple YAML string.
 *
 * @param {Record<string, any>} obj
 * @param {number} [indent=0]
 * @returns {string}
 */
export function stringifyYaml(obj, indent = 0) {
	if (obj == null) return ''
	const prefix = '  '.repeat(indent)
	const lines = []

	for (const [key, value] of Object.entries(obj)) {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			lines.push(`${prefix}${key}:`)
			lines.push(stringifyYaml(value, indent + 1))
		} else if (Array.isArray(value)) {
			lines.push(`${prefix}${key}:`)
			for (const item of value) {
				lines.push(`${prefix}  - ${formatValue(item)}`)
			}
		} else {
			lines.push(`${prefix}${key}: ${formatValue(value)}`)
		}
	}

	return lines.join('\n')
}

/**
 * @param {any} value
 * @returns {string}
 */
function formatValue(value) {
	if (value === null || value === undefined) return 'null'
	if (typeof value === 'boolean') return String(value)
	if (typeof value === 'number') return String(value)
	const str = String(value)
	// Quote strings that contain special characters
	if (
		str.includes(':') ||
		str.includes('#') ||
		str.includes('\n') ||
		str.startsWith(' ') ||
		str.startsWith('{') ||
		str.startsWith('[')
	) {
		return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
	}
	return str
}
