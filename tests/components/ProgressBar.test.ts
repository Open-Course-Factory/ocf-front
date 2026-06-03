/**
 * Tests for ProgressBar — a generic design-system progress bar (SSOT for the
 * ~4 hand-rolled bars across the app). Presentational: it renders only the bar
 * visual; the consumer renders its own text/label alongside.
 *
 * Contract:
 *   Props: value:number, max?:number (default 100),
 *          variant?:'primary'|'success'|'danger'|'warning' (default 'primary').
 *   Renders `.progress` (track) > `.progress-bar` (fill) with
 *     :style="{ width: pct + '%' }", pct = clamp((value/max)*100, 0, 100).
 *   Zero/empty guard: max <= 0 → 0% (never NaN/Infinity).
 *   Variant → a color modifier class (e.g. .progress-bar--success).
 *   A11y: role="progressbar", aria-valuenow=value, aria-valuemin=0,
 *         aria-valuemax=max.
 *
 * No i18n: this DS primitive uses no t(), so it mounts without an i18n plugin.
 * Assertions pin the rendered fill width / classes / aria attributes.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import ProgressBar from '../../src/components/Common/ProgressBar.vue'

function widthOf(wrapper: ReturnType<typeof mount>): string {
  const fill = wrapper.find('.progress-bar')
  return fill.attributes('style') || ''
}

describe('ProgressBar', () => {
  it('renders a track containing a fill', () => {
    const wrapper = mount(ProgressBar, { props: { value: 50 } })
    expect(wrapper.find('.progress').exists()).toBe(true)
    expect(wrapper.find('.progress .progress-bar').exists()).toBe(true)
  })

  it('computes the fill width from value/max', () => {
    const wrapper = mount(ProgressBar, { props: { value: 12, max: 20 } })
    expect(widthOf(wrapper)).toMatch(/width:\s*60%/)
  })

  it('defaults max to 100', () => {
    const wrapper = mount(ProgressBar, { props: { value: 30 } })
    expect(widthOf(wrapper)).toMatch(/width:\s*30%/)
  })

  it('clamps over-100% to 100%', () => {
    const wrapper = mount(ProgressBar, { props: { value: 25, max: 20 } })
    expect(widthOf(wrapper)).toMatch(/width:\s*100%/)
  })

  it('clamps negative value to 0%', () => {
    const wrapper = mount(ProgressBar, { props: { value: -5, max: 20 } })
    expect(widthOf(wrapper)).toMatch(/width:\s*0%/)
  })

  it('guards max <= 0 → 0% (no NaN/Infinity)', () => {
    const wrapper = mount(ProgressBar, { props: { value: 10, max: 0 } })
    const style = widthOf(wrapper)
    expect(style).toMatch(/width:\s*0%/)
    expect(style).not.toContain('NaN')
    expect(style).not.toContain('Infinity')
  })

  it('renders 0% for value 0', () => {
    const wrapper = mount(ProgressBar, { props: { value: 0, max: 20 } })
    expect(widthOf(wrapper)).toMatch(/width:\s*0%/)
  })

  it('applies a variant modifier class', () => {
    const wrapper = mount(ProgressBar, { props: { value: 50, variant: 'success' } })
    expect(wrapper.find('.progress-bar').classes()).toContain('progress-bar--success')
  })

  it('defaults to the primary variant', () => {
    const wrapper = mount(ProgressBar, { props: { value: 50 } })
    expect(wrapper.find('.progress-bar').classes()).toContain('progress-bar--primary')
  })

  it('sets the progressbar a11y role and aria values', () => {
    const wrapper = mount(ProgressBar, { props: { value: 12, max: 20 } })
    const bar = wrapper.find('[role="progressbar"]')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('aria-valuenow')).toBe('12')
    expect(bar.attributes('aria-valuemin')).toBe('0')
    expect(bar.attributes('aria-valuemax')).toBe('20')
  })
})
