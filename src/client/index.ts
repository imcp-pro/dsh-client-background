/**
 * Background plugin, browser half: reads the `client-background` settings
 * scope, applies the background effect reactively, and registers the settings
 * card that edits those settings. The Host half owns the namespace; this half
 * owns the effect and the card.
 *
 * @module @imcp-pro/dsh-client-background/client
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the `settings.plugin.item` SlotMap declaration (the register
// call below targets it).
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
// Type-only: the services this half reads through `ctx.get` below.
import type { SettingsScope, SettingsScopeBinder } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import type { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { PLUGIN_ID, SETTINGS_NAMESPACE, type BackgroundSettings } from '../config.ts'
import { mountBackground } from './background.ts'
import { BackgroundCardController } from './card-controller.ts'
import { BackgroundCard, cardCss } from './card.tsx'
import { en, zh } from './locales.ts'

/** Locale namespace the card and its dictionary live under. */
const LOCALE_NS = 'client-background'

/** Required services (cordis fiber inject). */
export const inject = ['settingsScope', 'slots', 'locale']

/**
 * Client plugin body: register the card dictionary and stylesheet, bind the
 * settings scope, drive the background effect from it, and register the card.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  // Read the services through the global store so this standalone plugin does
  // not depend on the package-level Context augmentations merging.
  const locale = ctx.get('locale') as LocaleRuntime
  const settingsScope = ctx.get('settingsScope') as SettingsScopeBinder
  const slots = ctx.get('slots') as SlotRegistry

  ctx.effect(() => locale.register(LOCALE_NS, { zh, en }), `${PLUGIN_ID}: card dictionaries`)

  // One package-owned stylesheet for the card chrome.
  ctx.effect(() => {
    if (typeof document === 'undefined') return () => {}
    const tag = document.createElement('style')
    tag.dataset.plugin = PLUGIN_ID
    tag.dataset.pluginCss = `${PLUGIN_ID}/card`
    tag.textContent = cardCss
    document.head.appendChild(tag)
    return () => { tag.remove() }
  }, `${PLUGIN_ID}: card stylesheet`)

  const scope: SettingsScope<BackgroundSettings> = settingsScope.bind({ namespace: SETTINGS_NAMESPACE })
  const controller = new BackgroundCardController(scope)
  ctx.effect(() => () => controller.dispose(), `${PLUGIN_ID}: card controller`)

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

  // The settings card, keyed on the namespace the Host registered.
  slots.inject('settings.plugin.item', () => slots.register({
    name: 'settings.plugin.item',
    key: SETTINGS_NAMESPACE,
    locale: LOCALE_NS,
    inject: () => controller.inject(),
  }, BackgroundCard))
}
