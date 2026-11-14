/**
 * ParticipantStatusChips — the participant's control state at a glance (#384),
 * in the members list's name cell and on the wall's tile: internet off, and a
 * block in the class, the organisation or the platform. Same chips in both
 * places, read from the class's one bulk read.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ParticipantStatusChips from '../../src/components/Groups/ParticipantStatusChips.vue'

/** The class block as the bulk read carries it: the reason only. */
const BLOCK = { reason: 'Exam' }

function participant(overrides: Record<string, unknown> = {}) {
  return {
    user_id: 'u-karim',
    user_name: 'Karim',
    role: 'member',
    class_block: null,
    org_blocked: false,
    global_block: false,
    network_cut: false,
    sessions: [],
    ...overrides
  }
}

function mountChips(p: unknown, locale: 'en' | 'fr' = 'en') {
  return mount(ParticipantStatusChips, {
    props: { participant: p },
    global: {
      plugins: [createI18n({
        legacy: false, locale, fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false
      })]
    }
  })
}

const CHIPS = ['internet-off', 'blocked-class', 'blocked-org', 'blocked-platform']
function chips(wrapper: ReturnType<typeof mountChips>) {
  return CHIPS.filter(name => wrapper.find(`[data-testid="participant-chip-${name}"]`).exists())
}

describe('ParticipantStatusChips', () => {
  it('shows nothing for a participant with nothing to report', () => {
    expect(chips(mountChips(participant()))).toEqual([])
  })

  it('shows nothing without a participant (no bulk read yet)', () => {
    expect(chips(mountChips(null))).toEqual([])
  })

  it('says internet is off when a live session has it cut', () => {
    const wrapper = mountChips(participant({
      sessions: [{ session_id: 's-1', state: 'running', network_feature: true, network_disabled: true }]
    }))

    expect(chips(wrapper)).toEqual(['internet-off'])
    expect(wrapper.find('[data-testid="participant-chip-internet-off"]').classes()).toContain('badge')
  })

  it('ignores the internet flag of a deleted session', () => {
    const wrapper = mountChips(participant({
      sessions: [{ session_id: 's-1', state: 'deleted', network_feature: true, network_disabled: true }]
    }))

    expect(chips(wrapper)).toEqual([])
  })

  it('names each block by its scope', () => {
    const wrapper = mountChips(participant({ class_block: BLOCK, org_blocked: true, global_block: true }))

    expect(chips(wrapper)).toEqual(['blocked-class', 'blocked-org', 'blocked-platform'])
    expect(wrapper.find('[data-testid="participant-chip-blocked-class"]').text()).toMatch(/class/i)
    expect(wrapper.find('[data-testid="participant-chip-blocked-org"]').text()).toMatch(/organi[sz]ation/i)
    expect(wrapper.find('[data-testid="participant-chip-blocked-platform"]').text()).toMatch(/platform/i)
  })

  it('carries the block reason as the chip’s tooltip', () => {
    const wrapper = mountChips(participant({ class_block: BLOCK }))

    expect(wrapper.find('[data-testid="participant-chip-blocked-class"]').attributes('title')).toContain('Exam')
  })

  it('says internet is off when the participant’s internet is cut, even with no session', () => {
    const wrapper = mountChips(participant({ network_cut: true }))

    expect(chips(wrapper)).toEqual(['internet-off'])
  })

  it('words the organisation chip as a session-start block, like the French', () => {
    const wrapper = mountChips(participant({ org_blocked: true }))

    expect(wrapper.find('[data-testid="participant-chip-blocked-org"]').text()).toBe('Session start blocked by the organisation')
  })

  it('shows the organisation block from the flag, with neither reason nor author', () => {
    const wrapper = mountChips(participant({ org_blocked: true }))

    expect(chips(wrapper)).toEqual(['blocked-org'])
    const chip = wrapper.find('[data-testid="participant-chip-blocked-org"]')
    expect(chip.attributes('title')).toBe(chip.text())
  })

  it('words the French chips without gendered forms', () => {
    const wrapper = mountChips(participant({ network_cut: true, class_block: BLOCK, org_blocked: true, global_block: true }), 'fr')

    expect(chips(wrapper)).toEqual(['internet-off', 'blocked-class', 'blocked-org', 'blocked-platform'])
    for (const name of CHIPS) {
      const chip = wrapper.find(`[data-testid="participant-chip-${name}"]`)
      expect(`${chip.text()} ${chip.attributes('title')}`).not.toMatch(/Bloqué |débloqué|Votre formateur/)
    }
  })

  it('shows a reason that looks like a placeholder literally in the chip title', () => {
    for (const reason of ['a {b} c', '{reason}']) {
      const wrapper = mountChips(participant({ class_block: { reason } }))

      expect(wrapper.find('[data-testid="participant-chip-blocked-class"]').attributes('title')).toContain(reason)
    }
  })

  describe('the reserved slot', () => {
    // The slot holds one badge's height, empty or filled, so the row does not
    // grow when the bulk read answers. The height is one shared token, used by
    // the badge and by the slot.
    const componentsCss = readFileSync(resolve(__dirname, '../../src/assets/styles/components.css'), 'utf8')
    const chipsSfc = readFileSync(resolve(__dirname, '../../src/components/Groups/ParticipantStatusChips.vue'), 'utf8')
    const variablesCss = readFileSync(resolve(__dirname, '../../src/assets/styles/variables.css'), 'utf8')

    function rule(css: string, selector: string): string {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const match = css.match(new RegExp(`(^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`))
      return match ? match[2] : ''
    }

    it('carries the slot class before and after the read', () => {
      expect(mountChips(null).find('[data-testid="participant-chips-slot"]').classes()).toContain('ocf-participant-chips')
      expect(mountChips(participant({ network_cut: true })).find('[data-testid="participant-chips-slot"]').classes()).toContain('ocf-participant-chips')
    })

    it('defines the badge height as a shared token, without forcing it on every badge', () => {
      expect(variablesCss).toMatch(/--badge-min-height\s*:/)
      // Decision change: badges elsewhere keep their natural height.
      expect(rule(componentsCss, '.badge')).not.toMatch(/min-height/)
    })

    it('gives the slot that same min-height', () => {
      expect(rule(chipsSfc, '.ocf-participant-chips')).toMatch(/min-height:\s*var\(--badge-min-height\)/)
    })
  })

  it('speaks French', () => {
    const wrapper = mountChips(participant({ class_block: BLOCK }), 'fr')

    expect(wrapper.find('[data-testid="participant-chip-blocked-class"]').text()).toMatch(/classe/i)
  })
})
