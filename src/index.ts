/**
 * Background plugin, node half: registers the `client-background` settings
 * namespace so the Web client's Plugins configuration section can edit the
 * plugin's tunables. Every behavior is browser-side; this half only publishes
 * the schema.
 *
 * @module @imcp-pro/dsh-client-background
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
// Type-only: the settings seam's provider type, for the typed `ctx.get` cast.
import type { SettingsProvider } from '@deepseek-ai/dsh-settings'
import {
  DEFAULT_SETTINGS, MIN_ROTATION_INTERVAL_SECONDS, MIN_UPDATE_CHECK_INTERVAL_SECONDS,
  SETTINGS_NAMESPACE, type BackgroundSettings,
} from './config.ts'

export { SETTINGS_NAMESPACE } from './config.ts'
export type { BackgroundSettings } from './config.ts'

/** Required service: the settings provider this half registers into. */
export const inject = ['settings']

/** Resolved settings schema (the card renders this; the client reads it). */
export const Config: z<BackgroundSettings> = z.object({
  enabled: z.boolean().default(DEFAULT_SETTINGS.enabled),
  rotationIntervalSeconds: z.number().step(1).min(MIN_ROTATION_INTERVAL_SECONDS)
    .default(DEFAULT_SETTINGS.rotationIntervalSeconds),
  autoUpdate: z.boolean().default(DEFAULT_SETTINGS.autoUpdate),
  updateCheckIntervalSeconds: z.number().step(1).min(MIN_UPDATE_CHECK_INTERVAL_SECONDS)
    .default(DEFAULT_SETTINGS.updateCheckIntervalSeconds),
})

/**
 * Register the settings namespace. The `base` layer carries the schema
 * defaults so an absent user section resolves to them exactly (and a field the
 * user clears re-inherits them); `applies: 'live'` tells the card edits take
 * effect without a restart.
 * @param ctx - Host root context.
 */
export function apply(ctx: Context): void {
  // `ctx.get` reads the global service store without needing the package-level
  // Context augmentation (which is unavailable to a standalone plugin that
  // type-checks against this package's own published or source declarations).
  const settings = ctx.get('settings') as SettingsProvider
  settings.register(SETTINGS_NAMESPACE, Config, {
    applies: 'live',
    base: DEFAULT_SETTINGS,
  })
}
