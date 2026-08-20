/**
 * The recording pill must not appear from nowhere.
 *
 * Recording is detected by a command-history poll, mid-session. The pill used
 * to be v-if'd into the terminal toolbar at that moment; in a flex row already
 * close to wrapping, that pushes the row and everything under it — the user
 * sees the screen jump on a history refresh, at one window width and not
 * another.
 *
 * So the element is always rendered and merely hidden while idle: it holds its
 * slot from the first paint, and turning recording on changes nothing but its
 * visibility.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import RecordingIndicator from '../../src/components/Terminal/RecordingIndicator.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountIndicator(isRecording: boolean) {
  return mount(RecordingIndicator, {
    props: { isRecording },
    global: { plugins: [createTestI18n()] },
  })
}

describe('RecordingIndicator — reserved slot', () => {
  it('occupies its slot even when nothing is being recorded', () => {
    const wrapper = mountIndicator(false)

    const pill = wrapper.find('.recording-indicator')
    expect(pill.exists(), 'the element stays in the layout while idle').toBe(true)
    expect(pill.classes(), 'and is hidden rather than removed').toContain('is-idle')
  })

  it('hides itself from assistive tech while idle', () => {
    expect(mountIndicator(false).find('.recording-indicator').attributes('aria-hidden')).toBe('true')
    expect(mountIndicator(true).find('.recording-indicator').attributes('aria-hidden')).toBe('false')
  })

  it('shows the same element once recording starts', () => {
    const pill = mountIndicator(true).find('.recording-indicator')

    expect(pill.exists()).toBe(true)
    expect(pill.classes(), 'recording is the visible state').not.toContain('is-idle')
    expect(pill.find('.recording-dot').exists()).toBe(true)
  })
})
