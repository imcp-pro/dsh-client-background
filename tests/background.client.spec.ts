// @vitest-environment jsdom
/** Background effect: stylesheet injection, rotation, and disposal. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountBackground } from '../src/client/background.ts'

const PLUGIN_ID = '@imcp-pro/dsh-client-background'

describe('mountBackground', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.head.innerHTML = ''
    document.body.style.removeProperty('--dsh-bg-image')
  })
  afterEach(() => { vi.useRealTimers() })

  it('injects translucent tokens and a body image rule', () => {
    const dispose = mountBackground(20)
    const tag = document.querySelector(`style[data-plugin="${PLUGIN_ID}"]`)
    expect(tag).not.toBeNull()
    const css = tag?.textContent ?? ''
    expect(css).toContain('--dsw-alias-bg-base: rgba(255, 255, 255, 0.55)')
    expect(css).toContain('--dsw-specific-sidebar-fill: rgba(27, 27, 28, 0.55)')
    expect(css).toMatch(/^body \{[^}]*--dsw-alias-bg-base: rgba\(255, 255, 255, 0\.55\) !important;/m)
    expect(css).toMatch(/^body\[data-ds-dark-theme\] \{[^}]*--dsw-alias-bg-base: rgba\(21, 21, 23, 0\.55\) !important;/m)
    expect(css).toContain('background-image: var(--dsh-bg-image')
    expect(css).toContain('body::before')
    expect(css).toContain('background: rgba(0, 0, 0, 0.15)')
    expect(document.body.style.getPropertyValue('--dsh-bg-image')).toMatch(/^url\("https:/)
    dispose()
  })

  it('rotates on the interval and removes every effect on dispose', () => {
    const dispose = mountBackground(20)
    const before = document.body.style.getPropertyValue('--dsh-bg-image')
    vi.advanceTimersByTime(20_000)
    const after = document.body.style.getPropertyValue('--dsh-bg-image')
    expect(after).not.toBe('')
    expect(after).not.toBe(before)

    dispose()
    expect(document.querySelector(`style[data-plugin="${PLUGIN_ID}"]`)).toBeNull()
    expect(document.body.style.getPropertyValue('--dsh-bg-image')).toBe('')
  })
})
