/**
 * Tests for ScenarioHintPanel — the hint UI extracted from ScenarioPanel.vue
 * (commit #5 of ocf-front #243).
 *
 * Carved from the hint block (current markup lines 168–218). The component is
 * PRESENTATIONAL: hint state, the reveal API call, the nudge timer and the
 * auto-reveal-on-failure logic all stay in the parent. The child renders and
 * emits `reveal-next` / `toggle-hint`.
 *
 * Contract under test:
 *   Props: step:CurrentStepResponse|null (uses hints_total_count + hint),
 *          hasProgressiveHints:boolean, revealedHints:{level,content}[],
 *          isRevealingHint:boolean, showHint:boolean, hintNudgeActive:boolean,
 *          isReviewing:boolean.
 *   Emits: reveal-next [], toggle-hint [].
 *   Markup:
 *     - `.hint-transparency-notice` when hasProgressiveHints && !isReviewing.
 *     - Progressive `.hint-section` when hasProgressiveHints:
 *         `.hint-header` (`.hint-icon` + `.hint-counter`);
 *         one `.hint-item` per revealedHints entry (`.hint-level-label` +
 *           `.hint-content.markdown-content` = renderKillercodaMarkdown(content));
 *         `.hint-toggle` reveal button (+`.hint-nudge` when hintNudgeActive),
 *           :disabled=isRevealingHint, shown when revealed < total, click → reveal-next;
 *         `.hints-exhausted` when revealed > 0 && revealed >= total.
 *     - Legacy `.hint-section` when !hasProgressiveHints && step.hint:
 *         `.hint-toggle` (click → toggle-hint, aria-expanded=showHint);
 *         `.hint-content.markdown-content` only when showHint.
 *
 * i18n note: the test i18n plugin uses EMPTY messages with missingWarn off, so
 * t('scenarioPanel.foo', {...}) returns the bare KEY (no interpolation).
 * Assertions therefore pin STRUCTURE (classes, presence/count, attributes) and
 * prop-driven hint CONTENT (the markdown-rendered hint text, which is real data
 * — not i18n), never the translated chrome strings.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import type { CurrentStepResponse } from '../../src/services/domain/scenario'

import ScenarioHintPanel from '../../src/components/Terminal/ScenarioHintPanel.vue'

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

function makeStep(overrides: Partial<CurrentStepResponse> = {}): CurrentStepResponse {
  return {
    step_order: 0,
    total_steps: 3,
    title: 'A step',
    status: 'active',
    has_flag: false,
    hints_total_count: 3,
    hint: '',
    ...overrides,
  } as CurrentStepResponse
}

interface MountProps {
  step?: CurrentStepResponse | null
  hasProgressiveHints?: boolean
  revealedHints?: Array<{ level: number; content: string }>
  isRevealingHint?: boolean
  showHint?: boolean
  hintNudgeActive?: boolean
  isReviewing?: boolean
}

function mountPanel(props: MountProps = {}, locale: 'en' | 'fr' = 'en') {
  return mount(ScenarioHintPanel, {
    props: {
      step: makeStep(),
      hasProgressiveHints: true,
      revealedHints: [],
      isRevealingHint: false,
      showHint: false,
      hintNudgeActive: false,
      isReviewing: false,
      ...props,
    },
    global: {
      plugins: [createTestI18n(locale)],
    },
  })
}

describe('ScenarioHintPanel', () => {
  it('progressive hints, 0 revealed of 3: shows transparency notice + reveal button, no exhausted block', async () => {
    const wrapper = mountPanel({
      hasProgressiveHints: true,
      revealedHints: [],
      step: makeStep({ hints_total_count: 3 }),
    })

    expect(wrapper.find('.hint-transparency-notice').exists()).toBe(true)
    expect(wrapper.find('.hint-section').exists()).toBe(true)
    expect(wrapper.find('.hint-counter').exists()).toBe(true)

    const revealBtn = wrapper.find('button.hint-toggle')
    expect(revealBtn.exists()).toBe(true)
    expect(wrapper.find('.hints-exhausted').exists()).toBe(false)

    await revealBtn.trigger('click')
    expect(wrapper.emitted('reveal-next')).toBeTruthy()
    expect(wrapper.emitted('reveal-next')!.length).toBe(1)
  })

  it('isReviewing=true hides the transparency notice but still renders the hint section', () => {
    const wrapper = mountPanel({
      hasProgressiveHints: true,
      isReviewing: true,
      revealedHints: [],
    })

    expect(wrapper.find('.hint-transparency-notice').exists()).toBe(false)
    expect(wrapper.find('.hint-section').exists()).toBe(true)
  })

  it('renders one .hint-item per revealed hint, with its content, and keeps the reveal button while revealed < total', () => {
    const wrapper = mountPanel({
      hasProgressiveHints: true,
      step: makeStep({ hints_total_count: 3 }),
      revealedHints: [
        { level: 1, content: 'First clue text' },
        { level: 2, content: 'Second clue text' },
      ],
    })

    const items = wrapper.findAll('.hint-item')
    expect(items.length).toBe(2)
    expect(items[0].find('.hint-content.markdown-content').text()).toContain('First clue text')
    expect(items[1].find('.hint-content.markdown-content').text()).toContain('Second clue text')

    // 2 < 3 → reveal button still present, not exhausted.
    expect(wrapper.find('button.hint-toggle').exists()).toBe(true)
    expect(wrapper.find('.hints-exhausted').exists()).toBe(false)
  })

  it('when all hints are revealed: reveal button is gone and .hints-exhausted is shown', () => {
    const wrapper = mountPanel({
      hasProgressiveHints: true,
      step: makeStep({ hints_total_count: 2 }),
      revealedHints: [
        { level: 1, content: 'a' },
        { level: 2, content: 'b' },
      ],
    })

    expect(wrapper.find('button.hint-toggle').exists()).toBe(false)
    expect(wrapper.find('.hints-exhausted').exists()).toBe(true)
  })

  it('isRevealingHint=true disables the reveal button and shows the spinner', () => {
    const wrapper = mountPanel({
      hasProgressiveHints: true,
      isRevealingHint: true,
      revealedHints: [{ level: 1, content: 'a' }],
      step: makeStep({ hints_total_count: 3 }),
    })

    const revealBtn = wrapper.find('button.hint-toggle')
    expect(revealBtn.exists()).toBe(true)
    expect(revealBtn.attributes('disabled')).toBeDefined()
    expect(revealBtn.find('i.fas.fa-spinner.fa-spin').exists()).toBe(true)
  })

  it('hintNudgeActive=true adds the .hint-nudge class to the reveal button', () => {
    const wrapper = mountPanel({
      hasProgressiveHints: true,
      hintNudgeActive: true,
      revealedHints: [],
      step: makeStep({ hints_total_count: 3 }),
    })

    const revealBtn = wrapper.find('button.hint-toggle')
    expect(revealBtn.exists()).toBe(true)
    expect(revealBtn.classes()).toContain('hint-nudge')
  })

  it('legacy single hint: toggle button emits toggle-hint; content shows only when showHint is true', async () => {
    const step = makeStep({ hints_total_count: 0, hint: 'A legacy single hint' })

    // showHint=false → button present, content hidden.
    const collapsed = mountPanel({
      hasProgressiveHints: false,
      showHint: false,
      step,
    })
    expect(collapsed.find('.hint-section').exists()).toBe(true)
    const toggle = collapsed.find('button.hint-toggle')
    expect(toggle.exists()).toBe(true)
    expect(collapsed.find('.hint-content.markdown-content').exists()).toBe(false)

    await toggle.trigger('click')
    expect(collapsed.emitted('toggle-hint')).toBeTruthy()
    expect(collapsed.emitted('toggle-hint')!.length).toBe(1)

    // showHint=true → content rendered with the hint text.
    const expanded = mountPanel({
      hasProgressiveHints: false,
      showHint: true,
      step,
    })
    const content = expanded.find('.hint-content.markdown-content')
    expect(content.exists()).toBe(true)
    expect(content.text()).toContain('A legacy single hint')
  })

  it('renders nothing when there are no progressive hints and no legacy hint', () => {
    const wrapper = mountPanel({
      hasProgressiveHints: false,
      step: makeStep({ hints_total_count: 0, hint: '' }),
    })

    expect(wrapper.find('.hint-section').exists()).toBe(false)
    expect(wrapper.find('.hint-transparency-notice').exists()).toBe(false)
  })
})
