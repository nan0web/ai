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
export function matchProject(projectId: string, filter: string | undefined, nameToDir?: Map<string, string>): boolean;
/**
 * Loads the store CSV and builds a name→dir mapping.
 *
 * @param {import('@nan0web/db').DB} db
 * @returns {Promise<Map<string, string>>}  Map of lowercase package name → dir
 */
export function loadNameToDir(db: import("@nan0web/db").DB): Promise<Map<string, string>>;
