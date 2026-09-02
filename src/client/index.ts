/**
 * Background plugin, browser half: reads the `client-background` settings
 * scope, applies the background effect reactively, and contributes the plugin's
 * own inventory entry — a "壁纸背景" display name and a settings detail. The
 * Host half owns the namespace; this half owns the effect and the entry.
 *
 * @module @imcp-pro/dsh-client-background/client
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the `settings.pluginInventory.*` SlotMap declarations (the
// register calls below target them).
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugin-inventory/client'
// Type-only: the services this half reads through `ctx.get` below.
import type { SettingsScope, SettingsScopeBinder } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import type { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { PLUGIN_ID, SETTINGS_NAMESPACE, type BackgroundSettings } from '../config.ts'
import { mountBackground } from './background.ts'
import { BackgroundCardController } from './card-controller.ts'
import { BackgroundDetail, BackgroundTitle, cardCss } from './card.tsx'
import { en, zh } from './locales.ts'

/** Locale namespace the entry and its dictionary live under. */
const LOCALE_NS = 'client-background'

/** Required services (cordis fiber inject). */
export const inject = ['settingsScope', 'slots', 'locale']

/**
 * Client plugin body: register the entry dictionary and stylesheet, bind the
 * settings scope, drive the background effect from it, and contribute the
 * inventory title and detail under this plugin's module name.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  // Read the services through the global store so this standalone plugin does
  // not depend on the package-level Context augmentations merging.
  const locale = ctx.get('locale') as LocaleRuntime
  const settingsScope = ctx.get('settingsScope') as SettingsScopeBinder
  const slots = ctx.get('slots') as SlotRegistry

  ctx.effect(() => locale.register(LOCALE_NS, { zh, en }), `${PLUGIN_ID}: entry dictionaries`)

  // One package-owned stylesheet for the settings detail.
  ctx.effect(() => {
    if (typeof document === 'undefined') return () => {}
    const tag = document.createElement('style')
    tag.dataset.plugin = PLUGIN_ID
    tag.dataset.pluginCss = `${PLUGIN_ID}/detail`
    tag.textContent = cardCss
    document.head.appendChild(tag)
    return () => { tag.remove() }
  }, `${PLUGIN_ID}: detail stylesheet`)

  const scope: SettingsScope<BackgroundSettings> = settingsScope.bind({ namespace: SETTINGS_NAMESPACE })
  const controller = new BackgroundCardController(scope)
  ctx.effect(() => () => controller.dispose(), `${PLUGIN_ID}: detail controller`)

  // The background effect, re-mounted whenever the settings section changes.
  ctx.effect(() => {
    let dispose: (() => void) | undefined
    const reapply = (): void => {
      dispose?.()
      dispose = undefined
      if (typeof document === 'undefined') return
      const snapshot = scope.getSnapshot()
      if (snapshot.status !== 'ready' || snapshot.value?.enabled !== true) return
      dispose = mountBackground(snapshot.value.rotationIntervalSeconds)
    }
    reapply()
    const unsubscribe = scope.subscribe(reapply)
    return () => {
      unsubscribe()
      dispose?.()
    }
  }, `${PLUGIN_ID}: settings-driven background`)

  // The inventory display name, keyed on this plugin's Loader module name.
  slots.inject('settings.pluginInventory.title', () => slots.register({
    name: 'settings.pluginInventory.title',
    key: PLUGIN_ID,
    locale: LOCALE_NS,
  }, BackgroundTitle))

  // The settings detail, keyed on the same module name so the plugin list
  // renders it inside this plugin's own card.
  slots.inject('settings.pluginInventory.detail', () => slots.register({
    name: 'settings.pluginInventory.detail',
    key: PLUGIN_ID,
    locale: LOCALE_NS,
    inject: () => controller.inject(),
  }, BackgroundDetail))
}
