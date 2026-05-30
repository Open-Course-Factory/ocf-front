/**
 * Tests for ScenarioElapsedTimer — the live elapsed-time chip extracted from
 * ScenarioPanel.vue (MR #1 of ocf-front #243).
 *
 * Why this component exists: ScenarioPanel.vue runs a 1Hz setInterval that
 * mutates `liveElapsedTime`, re-rendering the entire 3K-line component every
 * second. Confining that 1Hz write to a tiny child component is the whole
 * point of the refactor.
 *
 * Contract under test (the implementer must satisfy these):
 *   - Prop `startedAt: string | null` (ISO datetime).
 *   - When null/empty → renders nothing (no `.elapsed-timer`).
 *   - When a valid past datetime → renders a `<span class="elapsed-timer">`
 *     containing `<i class="fas fa-clock">` + the formatted elapsed text.
 *   - The component owns its OWN setInterval(…, 1000) and recomputes the label
 *     itself every second (the parent never passes the formatted string in).
 *   - Formatting is identical to the old formatElapsed():
 *       totalSeconds = floor((Date.now() - start) / 1000)
 *       hours        = floor(totalSeconds / 3600)
 *       minutes      = floor((totalSeconds % 3600) / 60)
 *       seconds      = totalSeconds % 60
 *       hours > 0 → `${h}h ${m}m ${s}s`   else → `${m}m ${s}s`
 *   - Clears its interval on unmount (no leaked timers).
 *
 * These tests assert on rendered DOM text, not internal refs, and use fake
 * timers so Date.now() and the 1Hz tick are deterministic.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ScenarioElapsedTimer from '../../src/components/Terminal/ScenarioElapsedTimer.vue'

// A fixed "now" so elapsed computations are deterministic.
const NOW = new Date('2026-05-30T12:00:00.000Z').getTime()

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountTimer(startedAt: string | null, locale: 'en' | 'fr' = 'en') {
  return mount(ScenarioElapsedTimer, {
    props: { startedAt },
    global: {
      plugins: [createTestI18n(locale)],
    },
  })
}

// Build an ISO string for a datetime `secondsAgo` before the frozen NOW.
function isoSecondsAgo(secondsAgo: number): string {
  return new Date(NOW - secondsAgo * 1000).toISOString()
}

describe('ScenarioElapsedTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when startedAt is null', () => {
    const wrapper = mountTimer(null)
    expect(wrapper.find('.elapsed-timer').exists()).toBe(false)
  })

  it('renders nothing when startedAt is an empty string', () => {
    const wrapper = mountTimer('')
    expect(wrapper.find('.elapsed-timer').exists()).toBe(false)
  })

  it('renders the formatted elapsed label for a valid past datetime', () => {
    // 65s ago → 1 minute 5 seconds.
    const wrapper = mountTimer(isoSecondsAgo(65))

    const chip = wrapper.find('.elapsed-timer')
    expect(chip.exists()).toBe(true)
    // Clock icon must be present.
    expect(chip.find('i.fas.fa-clock').exists()).toBe(true)
    // Visible text reflects the m/s form.
    expect(chip.text()).toContain('1m 5s')
  })

  it('updates the label on each 1Hz tick', async () => {
    // Start exactly at NOW → 0m 0s initially.
    const wrapper = mountTimer(isoSecondsAgo(0))

    expect(wrapper.find('.elapsed-timer').text()).toContain('0m 0s')

    // Advance a SINGLE time axis by 2 seconds. Under vitest fake timers,
    // advanceTimersByTime also moves the faked Date.now() forward, so a
    // component that reads Date.now() live on each tick sees NOW+2000 and
    // renders "0m 2s". (Do NOT also call setSystemTime here — that would
    // double-advance the clock for a live reader and wrongly force a
    // counter-based implementation that drifts in throttled tabs.)
    vi.advanceTimersByTime(2000)
    await flushPromises()

    expect(wrapper.find('.elapsed-timer').text()).toContain('0m 2s')
  })

  it('uses the Xh Ym Zs form when started more than an hour ago', () => {
    // 1h 2m 3s ago = 3723 seconds.
    const wrapper = mountTimer(isoSecondsAgo(3723))

    expect(wrapper.find('.elapsed-timer').text()).toContain('1h 2m 3s')
  })

  it('stops updating after unmount (interval is cleared, no leaked ticks)', async () => {
    const wrapper = mountTimer(isoSecondsAgo(0))
    expect(wrapper.find('.elapsed-timer').text()).toContain('0m 0s')

    wrapper.unmount()

    // Advancing timers after unmount must not throw and must not produce
    // further work; if the interval leaked, pending timers would remain.
    vi.setSystemTime(NOW + 5000)
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow()
    expect(vi.getTimerCount()).toBe(0)
  })
})
