/** Card controller: staging, save, and the client-side update check. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  SettingsScope, SettingsScopeSnapshot,
} from '@deepseek-ai/dsh-client-ui-settings/client'
import { BackgroundCardController } from '../src/client/card-controller.ts'
import { DEFAULT_SETTINGS, type BackgroundSettings } from '../src/config.ts'

/** Build a fake scope around one resolved section, with a spyable mutate. */
function setup(initial: BackgroundSettings = DEFAULT_SETTINGS) {
  let snapshot: SettingsScopeSnapshot<BackgroundSettings> = {
    status: 'ready',
    value: initial,
    base: undefined,
    user: undefined,
    revision: 1,
    writable: true,
    mode: 'host',
  }
  const listeners = new Set<() => void>()
  const mutate = vi.fn(async () => {})
  const scope: SettingsScope<BackgroundSettings> = {
    getSnapshot: () => snapshot,
    subscribe: (fn) => {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
    mutate,
    set: vi.fn(async () => {}),
    unset: vi.fn(async () => {}),
  }
  const emit = (next: BackgroundSettings): void => {
    snapshot = { ...snapshot, value: next, revision: (snapshot.revision ?? 0) + 1 }
    for (const fn of [...listeners]) fn()
  }
  return { scope, mutate, emit }
}

const okCommit = (sha: string) => ({ ok: true, status: 200, json: async () => [{ sha }] })

describe('BackgroundCardController', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('stages an edit without persisting', () => {
    const { scope, mutate } = setup()
    const controller = new BackgroundCardController(scope)
    controller.edit('enabled', false)

    const state = controller.inject().hooks.backgroundCard.getSnapshot()
    expect(state.draft).toEqual({ ...DEFAULT_SETTINGS, enabled: false })
    expect(mutate).not.toHaveBeenCalled()
    controller.dispose()
  })

  it('saves staged fields in one atomic mutation and clears the draft', async () => {
    const { scope, mutate } = setup()
    const controller = new BackgroundCardController(scope)
    controller.edit('enabled', false)
    controller.edit('rotationIntervalSeconds', 60)
    await controller.save()

    expect(mutate).toHaveBeenCalledTimes(1)
    // A staged draft carries the whole resolved section, so save writes every
    // field explicitly (the two edited ones plus the two unchanged defaults).
    expect(mutate.mock.calls[0][0]).toEqual([
      { op: 'set', path: ['enabled'], value: false },
      { op: 'set', path: ['rotationIntervalSeconds'], value: 60 },
      { op: 'set', path: ['autoUpdate'], value: false },
      { op: 'set', path: ['updateCheckIntervalSeconds'], value: 21600 },
    ])
    expect(controller.inject().hooks.backgroundCard.getSnapshot().draft).toBeUndefined()
    controller.dispose()
  })

  it('discards the draft and re-adopts the saved value on an external commit', () => {
    const { scope, emit } = setup()
    const controller = new BackgroundCardController(scope)
    controller.edit('enabled', false)
    emit({ ...DEFAULT_SETTINGS, rotationIntervalSeconds: 99 })

    const state = controller.inject().hooks.backgroundCard.getSnapshot()
    expect(state.saved).toEqual({ ...DEFAULT_SETTINGS, rotationIntervalSeconds: 99 })
    expect(state.draft).toEqual({ ...DEFAULT_SETTINGS, enabled: false })
    controller.discard()
    expect(controller.inject().hooks.backgroundCard.getSnapshot().draft).toBeUndefined()
    controller.dispose()
  })

  it('records the latest commit and clears checking after a successful check', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okCommit('abc123')))
    const { scope } = setup()
    const controller = new BackgroundCardController(scope)
    await controller.checkNow()

    const update = controller.inject().hooks.backgroundCard.getSnapshot().update
    expect(update.checking).toBe(false)
    expect(update.latestCommit).toBe('abc123')
    expect(update.error).toBeUndefined()
    // Without a build commit the card cannot tell whether it is newer.
    expect(update.available).toBe(false)
    controller.dispose()
  })

  it('records an error when the check fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })))
    const { scope } = setup()
    const controller = new BackgroundCardController(scope)
    await controller.checkNow()

    const update = controller.inject().hooks.backgroundCard.getSnapshot().update
    expect(update.checking).toBe(false)
    expect(update.error).toContain('HTTP 500')
    controller.dispose()
  })

  it('arms and clears the periodic check from the autoUpdate settings', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    vi.stubGlobal('fetch', vi.fn(async () => okCommit('abc123')))
    const { scope } = setup({ ...DEFAULT_SETTINGS, autoUpdate: true, updateCheckIntervalSeconds: 60 })
    const controller = new BackgroundCardController(scope)

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60_000)
    controller.dispose()
    expect(clearIntervalSpy).toHaveBeenCalled()
    setIntervalSpy.mockRestore()
    clearIntervalSpy.mockRestore()
  })
})
