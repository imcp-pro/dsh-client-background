/**
 * Shared settings contract for the background plugin: the settings namespace
 * key, the resolved section shape, and the schema defaults. The Host half wraps
 * these in a schemastery schema; the browser half reads the resolved JSON over
 * the settings scope, so this module carries types and constants only.
 *
 * @module @imcp-pro/dsh-client-background/config
 */

/** Settings namespace this plugin registers and its card edits. */
export const SETTINGS_NAMESPACE = 'client-background'

/** Package id, stamped onto owned DOM. Keep in sync with package.json. */
export const PLUGIN_ID = '@imcp-pro/dsh-client-background'

/** GitHub `owner/repo` the client update check polls. Keep in sync with `repository`. */
export const GITHUB_REPO = 'imcp-pro/dsh-client-background'

/** Resolved settings section. */
export interface BackgroundSettings {
  /** Whether the background effect runs; false removes it without unloading the plugin. */
  enabled: boolean
  /** Seconds between background image swaps. */
  rotationIntervalSeconds: number
  /** Whether to periodically poll GitHub for a newer commit. */
  autoUpdate: boolean
  /** Seconds between update checks. */
  updateCheckIntervalSeconds: number
}

/** Schema defaults (also the reset targets the card offers). */
export const DEFAULT_SETTINGS: BackgroundSettings = {
  enabled: true,
  rotationIntervalSeconds: 20,
  autoUpdate: false,
  updateCheckIntervalSeconds: 6 * 60 * 60,
}

/** Lower bound the schema enforces so a rotation timer can never be non-positive. */
export const MIN_ROTATION_INTERVAL_SECONDS = 1

/** Lower bound the schema enforces so an update check can never be non-positive. */
export const MIN_UPDATE_CHECK_INTERVAL_SECONDS = 60

/**
 * Build-time commit stamp injected by build.mjs (esbuild `define`). `typeof`
 * keeps the source runnable under vitest, where the define is absent.
 */
declare const __BUILD_COMMIT__: string

/** The git commit this bundle was built from, when build.mjs could resolve one. */
export const BUILD_COMMIT: string | undefined =
  typeof __BUILD_COMMIT__ === 'string' && __BUILD_COMMIT__ !== '' ? __BUILD_COMMIT__ : undefined
