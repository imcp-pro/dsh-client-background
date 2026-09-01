/** Host half: settings namespace registration and schema defaults. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { apply, inject, Config, SETTINGS_NAMESPACE } from '../src/index.ts'
import { DEFAULT_SETTINGS, type BackgroundSettings } from '../src/config.ts'

describe('background host half', () => {
  it('declares the settings service', () => {
    expect(inject).toEqual(['settings'])
  })

  it('fills defaults and enforces the numeric lower bounds', () => {
    const schema = Config as unknown as (value: unknown) => BackgroundSettings
    expect(schema({})).toEqual(DEFAULT_SETTINGS)
    expect(schema({ enabled: false })).toEqual({ ...DEFAULT_SETTINGS, enabled: false })
    expect(() => schema({ rotationIntervalSeconds: 0 })).toThrow()
    expect(() => schema({ updateCheckIntervalSeconds: 1 })).toThrow()
  })

  it('registers the namespace with live applies and the default base', () => {
    const ctx = new Context()
    const register = vi.fn()
    ctx.provide('settings', { register })
    apply(ctx)

    expect(register).toHaveBeenCalledTimes(1)
    expect(register.mock.calls[0][0]).toBe(SETTINGS_NAMESPACE)
    expect(register.mock.calls[0][2]).toMatchObject({ applies: 'live', base: DEFAULT_SETTINGS })
  })
})
