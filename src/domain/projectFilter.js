/**
 * Smart Project Filter — matches project directory paths against user-provided filters.
 *
 * Supports multiple matching strategies:
 * 1. `@scope/name` → exact package name lookup via store registry
 * 2. `name*` (glob) → wildcard match on last path segment
 * 3. `path/to/pkg` → exact path match
 * 4. `name` (default) → exact match on last path segment
 *
 * @param {string} projectId    Directory path from cache, e.g. "packages/ui-cli"
 * @param {string|undefined} filter  User input: "ui-cli", "@nan0web/ui", "ui*", "packages/ui"
 * @param {Map<string, string>} [nameToDir]  Package name → dir mapping from store
 * @returns {boolean}
 */
export function matchProject(projectId, filter, nameToDir) {
	if (!filter) return true

	const f = filter.toLowerCase().replace(/\/$/, '') // trim trailing slash
	const pid = projectId.toLowerCase()
	const lastSegment = pid.split('/').pop() || pid

	// 1. @scope/name → resolve via store registry (EXACT name match)
	//    "@nan0web/ui" must NOT match "apps/.../industrialbank/ui"
	if (f.startsWith('@')) {
		if (nameToDir) {
			const resolvedDir = nameToDir.get(f)
			return resolvedDir ? pid === resolvedDir.toLowerCase() : false
		}
		// Fallback: strip scope, match last segment
		const scopedName = f.split('/').pop() || f
		return lastSegment === scopedName
	}

	// 2. Glob/wildcard: "ui*" or "ui-*"
	if (f.includes('*')) {
		const regex = new RegExp(
			'^' + f.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
		)
		return regex.test(lastSegment)
	}

	// 3. Full path match: "packages/ui-cli"
	if (f.includes('/')) {
		return pid === f || pid.endsWith('/' + f)
	}

	// 4. Exact segment match (DEFAULT): "ui" = only "ui", not "ui-cli"
	return lastSegment === f
}

/**
 * Loads the store CSV and builds a name→dir mapping.
 *
 * @param {import('@nan0web/db').DB} db
 * @returns {Promise<Map<string, string>>}  Map of lowercase package name → dir
 */
export async function loadNameToDir(db) {
	const stores = ['~/store/nan0web_store.csv', '~/store/nan0web_store.local.csv']
	/** @type {Map<string, string>} */
	const nameToDir = new Map()

	for (const s of stores) {
		try {
			const rows = await db.loadDocumentAs('.csv', s, null)
			if (Array.isArray(rows)) {
				for (const r of rows) {
					if (r.name && r.path) {
						// Use db.relative to convert absolute path to workspace-relative
						const dir = db.relative(r.path)
						nameToDir.set(r.name.toLowerCase(), dir)
					}
				}
			}
		} catch (e) {
			// Store file not found — skip
		}
	}

	return nameToDir
}
