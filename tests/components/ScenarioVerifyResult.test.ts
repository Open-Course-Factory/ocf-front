/**
 * Tests for ScenarioVerifyResult — the terminal-step verify UI extracted from
 * ScenarioPanel.vue (commit #2 of ocf-front #243).
 *
 * Carved from the `resolvedStepType === 'terminal'` block of ScenarioPanel.vue
 * (current markup lines 225–243). The component owns the verify button and the
 * pass/fail result panel; the parent drives it via props and listens for the
 * `verify` emit.
 *
 * Contract under test:
 *   Props:
 *     - isActive: boolean
 *     - isVerifying: boolean
 *     - result: VerifyStepResponse | null   (default null)
 *   Emits:
 *     - verify (no payload), on button click
 *   Button `<button class="verify-btn">`:
 *     - disabled when `isVerifying || !isActive`
 *     - while verifying: icon `fas fa-spinner fa-spin` + text t('scenarioPanel.verifying')
 *     - otherwise:        icon `fas fa-check-circle`   + text t('scenarioPanel.verify')
 *   Result panel (only when result !== null):
 *     - `<div class="verify-result" :class="{passed, failed}" role="status" aria-live="polite">`
 *     - `.verify-result-header`: icon `fas fa-check-circle` (passed) / `fas fa-times-circle` (failed)
 *       + span t('scenarioPanel.passed') / t('scenarioPanel.failed')
 *     - when result.output set: `.verify-output` with `.output-label` (t('scenarioPanel.output'))
 *       and `<pre class="output-text">{{ result.output }}</pre>`
 *
 * Tests assert on user-observable DOM/behavior only, using a real createI18n
 * plugin (useTranslations → useI18n needs a real instance).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import type { VerifyStepResponse } from '../../src/services/domain/scenario'

import ScenarioVerifyResult from '../../src/components/Terminal/ScenarioVerifyResult.vue'

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

interface MountProps {
  isActive?: boolean
  isVerifying?: boolean
  result?: VerifyStepResponse | null
}

function mountVerify(props: MountProps = {}, locale: 'en' | 'fr' = 'en') {
  return mount(ScenarioVerifyResult, {
    props: {
      isActive: true,
      isVerifying: false,
      result: null,
      ...props,
    },
    global: {
      plugins: [createTestI18n(locale)],
    },
  })
}

describe('ScenarioVerifyResult', () => {
  it('renders the verify button with the verify label and emits verify on click', async () => {
    const wrapper = mountVerify({ isActive: true, isVerifying: false })

    const btn = wrapper.find('button.verify-btn')
    expect(btn.exists()).toBe(true)
    // Not verifying → check-circle icon + "Verify" label.
    expect(btn.find('i.fas.fa-check-circle').exists()).toBe(true)
    expect(btn.text()).toContain('Verify')
    // Enabled when active and not verifying.
    expect(btn.attributes('disabled')).toBeUndefined()

    await btn.trigger('click')
    expect(wrapper.emitted('verify')).toBeTruthy()
    expect(wrapper.emitted('verify')!.length).toBe(1)
  })

  it('disables the button and shows the verifying label + spinner while verifying', () => {
    const wrapper = mountVerify({ isActive: true, isVerifying: true })

    const btn = wrapper.find('button.verify-btn')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.find('i.fas.fa-spinner.fa-spin').exists()).toBe(true)
    expect(btn.text()).toContain('Verifying')
  })

  it('disables the button when the step is not active', () => {
    const wrapper = mountVerify({ isActive: false, isVerifying: false })

    const btn = wrapper.find('button.verify-btn')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('renders no result panel when result is null', () => {
    const wrapper = mountVerify({ result: null })
    expect(wrapper.find('.verify-result').exists()).toBe(false)
  })

  it('renders a passed result with the passed text and check icon', () => {
    const wrapper = mountVerify({ result: { passed: true } })

    const panel = wrapper.find('.verify-result')
    expect(panel.exists()).toBe(true)
    expect(panel.classes()).toContain('passed')
    expect(panel.classes()).not.toContain('failed')

    const header = panel.find('.verify-result-header')
    expect(header.find('i.fas.fa-check-circle').exists()).toBe(true)
    expect(header.text()).toContain('Step completed!')
  })

  it('renders a failed result with the failed text and the output block', () => {
    const wrapper = mountVerify({ result: { passed: false, output: 'boom' } })

    const panel = wrapper.find('.verify-result')
    expect(panel.exists()).toBe(true)
    expect(panel.classes()).toContain('failed')
    expect(panel.classes()).not.toContain('passed')

    const header = panel.find('.verify-result-header')
    expect(header.find('i.fas.fa-times-circle').exists()).toBe(true)
    expect(header.text()).toContain('Not quite right')

    const output = panel.find('.verify-output')
    expect(output.exists()).toBe(true)
    expect(output.find('.output-label').text()).toContain('Output')
    const pre = output.find('pre.output-text')
    expect(pre.exists()).toBe(true)
    expect(pre.text()).toBe('boom')
  })

  it('omits the output block when a passed result has no output', () => {
    const wrapper = mountVerify({ result: { passed: true } })

    expect(wrapper.find('.verify-result').exists()).toBe(true)
    expect(wrapper.find('.verify-output').exists()).toBe(false)
  })
})
