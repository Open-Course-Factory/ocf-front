/**
 * Live counters refresh on a timer, but only for somebody who is looking
 * (issue #309): a console left open in a background tab must stop asking the
 * backend, and must be current again the moment the teacher comes back.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useVisiblePolling } from '../../src/composables/useVisiblePolling'

function mountPoller(poll: () => void, intervalMs = 30000) {
  const Host = defineComponent({
    setup() {
      useVisiblePolling(poll, intervalMs)
      return () => h('div')
    },
  })
  return mount(Host)
}

function setTabHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useVisiblePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('polls once per interval while the tab is visible', () => {
    const poll = vi.fn()
    mountPoller(poll)

    vi.advanceTimersByTime(90000)

    expect(poll).toHaveBeenCalledTimes(3)
  })

  it('does not poll before the first interval elapses', () => {
    const poll = vi.fn()
    mountPoller(poll)

    vi.advanceTimersByTime(29999)

    expect(poll).not.toHaveBeenCalled()
  })

  it('skips the poll while the tab is hidden', () => {
    const poll = vi.fn()
    mountPoller(poll)
    setTabHidden(true)
    poll.mockClear()

    vi.advanceTimersByTime(120000)

    expect(poll).not.toHaveBeenCalled()
  })

  it('polls immediately when the tab becomes visible again', () => {
    const poll = vi.fn()
    mountPoller(poll)
    setTabHidden(true)
    poll.mockClear()

    setTabHidden(false)

    expect(poll).toHaveBeenCalledTimes(1)
  })

  it('resumes the interval after the tab comes back', () => {
    const poll = vi.fn()
    mountPoller(poll)
    setTabHidden(true)
    setTabHidden(false)
    poll.mockClear()

    vi.advanceTimersByTime(30000)

    expect(poll).toHaveBeenCalledTimes(1)
  })

  it('stops polling once the component is unmounted', () => {
    const poll = vi.fn()
    const wrapper = mountPoller(poll)

    wrapper.unmount()
    vi.advanceTimersByTime(120000)

    expect(poll).not.toHaveBeenCalled()
  })

  it('ignores visibility changes after unmount', () => {
    const poll = vi.fn()
    const wrapper = mountPoller(poll)
    wrapper.unmount()

    setTabHidden(true)
    setTabHidden(false)

    expect(poll).not.toHaveBeenCalled()
  })
})
