// @vitest-environment jsdom
/** Background browser half: stylesheet injection, rotation, and disposal. */
import { Context } from '@deepseek-ai/cordis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apply, inject } from '../src/client/index.ts'

const PLUGIN_ID = '@imcp-pro/dsh-client-background'

describe('background apply', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.head.innerHTML = ''
    document.body.style.removeProperty('--dsh-bg-image')
  })
  afterEach(() => { vi.useRealTimers() })

  it('declares no services', () => {
    expect(inject).toEqual([])
  })

  it('injects translucent tokens and a body image rule', async () => {
    const ctx = new Context()
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()

    const tag = document.querySelector(`style[data-plugin="${PLUGIN_ID}"]`)
    expect(tag).not.toBeNull()
    const css = tag?.textContent ?? ''
    expect(css).toContain('--dsw-alias-bg-base: rgba(255, 255, 255, 0.55)')
    expect(css).toContain('--dsw-specific-sidebar-fill: rgba(27, 27, 28, 0.55)')
    expect(css).toContain('background-image: var(--dsh-bg-image')
    expect(document.body.style.getPropertyValue('--dsh-bg-image')).toMatch(/^url\("https:/)

    await fiber.dispose()
  })

  it('rotates on the interval and removes every effect on dispose', async () => {
    const ctx = new Context()
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()

    const before = document.body.style.getPropertyValue('--dsh-bg-image')
    await vi.advanceTimersByTimeAsync(20_000)
    const after = document.body.style.getPropertyValue('--dsh-bg-image')
    expect(after).not.toBe('')
    expect(after).not.toBe(before)

    await fiber.dispose()
    expect(document.querySelector(`style[data-plugin="${PLUGIN_ID}"]`)).toBeNull()
    expect(document.body.style.getPropertyValue('--dsh-bg-image')).toBe('')
  })
})
