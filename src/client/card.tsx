/**
 * The background plugin's inventory entry: a display-name override
 * ("壁纸背景") and a settings detail (enable switch, rotation interval,
 * auto-update check) that the plugin list renders inside this plugin's own
 * card.
 *
 * @module @imcp-pro/dsh-client-background/client/card
 */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the `settings.pluginInventory.*` SlotMap declarations into this program.
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugin-inventory/client'
import {
  DEFAULT_SETTINGS, GITHUB_REPO, MIN_ROTATION_INTERVAL_SECONDS,
  MIN_UPDATE_CHECK_INTERVAL_SECONDS, type BackgroundSettings,
} from '../config.ts'
import type { BackgroundCardFace } from './card-controller.ts'

/** Title-override props (the inventory supplies nothing). */
export type BackgroundTitleProps =
  PropsRuntime<'settings.pluginInventory.title'>
  & PropsLocale<'client-background'>

/** Detail-form props assembled by the inventory slot renderer. */
export type BackgroundDetailProps =
  PropsRuntime<'settings.pluginInventory.detail'>
  & PropsLocale<'client-background'>
  & InjectFace<BackgroundCardFace>

/** Owned detail stylesheet, injected once by the plugin apply. */
export const cardCss = [
  '.dbg-detail { display: flex; flex-direction: column; gap: 12px; }',
  '.dbg-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }',
  '.dbg-toggle-row { align-items: center; }',
  '.dbg-field { display: flex; flex-direction: column; gap: 2px; min-width: 0; }',
  '.dbg-label { font-weight: 500; }',
  '.dbg-hint { opacity: 0.7; font-size: 0.8125rem; }',
  '.dbg-number { width: 9ch; }',
  '.dbg-update { display: flex; flex-direction: column; gap: 6px; }',
  '.dbg-update-row { display: flex; align-items: center; gap: 10px; }',
  '.dbg-status { flex: 1; font-size: 0.875rem; min-width: 0; }',
  '.dbg-update-command { display: flex; flex-direction: column; gap: 6px; }',
  '.dbg-code { font-family: ui-monospace, monospace; font-size: 0.8125rem; word-break: break-all; }',
  '.dbg-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }',
  '.dbg-unsaved { margin-right: auto; opacity: 0.7; font-size: 0.8125rem; }',
  '.dbg-error { margin: 0; font-weight: 500; }',
  '.dbg-unavailable { margin: 0; opacity: 0.7; }',
].join('\n')

/** The manual update command the detail surfaces. */
const UPDATE_COMMAND = `dsh plugin --profile web update github:${GITHUB_REPO}`

/**
 * Render the inventory card title.
 * @param props - locale copy.
 * @returns the display name.
 */
export function BackgroundTitle({ t }: BackgroundTitleProps) {
  return <>{t('title')}</>
}

/**
 * Render the background plugin's settings detail.
 * @param props - locale copy, the card snapshot, and its form actions.
 * @returns the settings form.
 */
export function BackgroundDetail(props: BackgroundDetailProps) {
  const { t } = props
  const state = props.useBackgroundCard(snapshot => snapshot)
  const value: BackgroundSettings = state.draft ?? state.saved ?? DEFAULT_SETTINGS
  const unavailable = state.status !== 'ready'
  const disabled = !state.writable || state.saving
  const dirty = state.draft !== undefined

  let statusText: string | undefined
  if (state.update.checking) statusText = t('updateChecking')
  else if (state.update.error !== undefined) statusText = `${t('updateError')}: ${state.update.error}`
  else if (state.update.available) statusText = t('updateAvailable')
  else if (state.update.latestCommit !== undefined) {
    statusText = state.update.currentCommit === undefined ? t('updateUnknown') : t('updateUpToDate')
  }

  const copyCommand = (): void => {
    void navigator.clipboard?.writeText(UPDATE_COMMAND)
  }

  return (
    <div className="dbg-detail">
      {unavailable && <p className="dbg-unavailable">{t('unavailable')}</p>}

      <label className="dbg-row dbg-toggle-row">
        <span className="dbg-field">
          <span className="dbg-label">{t('enabled')}</span>
          <span className="dbg-hint">{t('enabledHint')}</span>
        </span>
        <input
          type="checkbox"
          checked={value.enabled}
          disabled={disabled || unavailable}
          onChange={(event) => { props.edit('enabled', event.target.checked) }}
        />
      </label>

      <label className="dbg-row">
        <span className="dbg-field">
          <span className="dbg-label">{t('rotationInterval')}</span>
          <span className="dbg-hint">{t('rotationIntervalHint')}</span>
        </span>
        <input
          type="number"
          className="dbg-number"
          min={MIN_ROTATION_INTERVAL_SECONDS}
          step={1}
          value={value.rotationIntervalSeconds}
          disabled={disabled || unavailable}
          onChange={(event) => {
            const next = event.target.valueAsNumber
            if (Number.isFinite(next)) props.edit('rotationIntervalSeconds', next)
          }}
        />
      </label>

      <label className="dbg-row dbg-toggle-row">
        <span className="dbg-field">
          <span className="dbg-label">{t('autoUpdate')}</span>
          <span className="dbg-hint">{t('autoUpdateHint')}</span>
        </span>
        <input
          type="checkbox"
          checked={value.autoUpdate}
          disabled={disabled || unavailable}
          onChange={(event) => { props.edit('autoUpdate', event.target.checked) }}
        />
      </label>

      <label className="dbg-row">
        <span className="dbg-field">
          <span className="dbg-label">{t('updateCheckInterval')}</span>
          <span className="dbg-hint">{t('updateCheckIntervalHint')}</span>
        </span>
        <input
          type="number"
          className="dbg-number"
          min={MIN_UPDATE_CHECK_INTERVAL_SECONDS}
          step={1}
          value={value.updateCheckIntervalSeconds}
          disabled={disabled || unavailable}
          onChange={(event) => {
            const next = event.target.valueAsNumber
            if (Number.isFinite(next)) props.edit('updateCheckIntervalSeconds', next)
          }}
        />
      </label>

      <div className="dbg-update">
        <div className="dbg-update-row">
          <span className="dbg-label">{t('updateStatus')}</span>
          {statusText !== undefined && <span className="dbg-status">{statusText}</span>}
          <button type="button" onClick={props.checkNow} disabled={state.update.checking}>
            {t('checkNow')}
          </button>
        </div>
        {state.update.available && (
          <div className="dbg-update-command">
            <span className="dbg-hint">{t('updateCommandHint')}</span>
            <code className="dbg-code">{UPDATE_COMMAND}</code>
            <button type="button" onClick={copyCommand}>{t('copy')}</button>
          </div>
        )}
      </div>

      <footer className="dbg-actions">
        {dirty && <span className="dbg-unsaved">{t('unsaved')}</span>}
        <button type="button" onClick={props.discard} disabled={!dirty || state.saving}>
          {t('discard')}
        </button>
        <button type="button" onClick={props.save} disabled={!dirty || disabled || unavailable}>
          {t('save')}
        </button>
      </footer>
      {state.saveError !== undefined && <p className="dbg-error">{state.saveError}</p>}
    </div>
  )
}
