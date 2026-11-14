/**
 * ParticipantStatusChips — the participant's control state at a glance (#384),
 * in the members list's name cell and on the wall's tile: internet off, and a
 * block in the class, the organisation or the platform. Same chips in both
 * places, read from the class's one bulk read.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import ParticipantStatusChips from '../../src/components/Groups/ParticipantStatusChips.vue'

const BLOCK = { reason: 'Exam', blocked_by: 'u-marc', created_at: '2026-11-14T10:00:00Z' }

function participant(overrides: Record<string, unknown> = {}) {
  return {
    user_id: 'u-karim',
    user_name: 'Karim',
    role: 'member',
    class_block: null,
    org_block: null,
    global_block: false,
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
    const wrapper = mountChips(participant({ class_block: BLOCK, org_block: BLOCK, global_block: true }))

    expect(chips(wrapper)).toEqual(['blocked-class', 'blocked-org', 'blocked-platform'])
    expect(wrapper.find('[data-testid="participant-chip-blocked-class"]').text()).toMatch(/class/i)
    expect(wrapper.find('[data-testid="participant-chip-blocked-org"]').text()).toMatch(/organi[sz]ation/i)
    expect(wrapper.find('[data-testid="participant-chip-blocked-platform"]').text()).toMatch(/platform/i)
  })

  it('carries the block reason as the chip’s tooltip', () => {
    const wrapper = mountChips(participant({ class_block: BLOCK }))

    expect(wrapper.find('[data-testid="participant-chip-blocked-class"]').attributes('title')).toContain('Exam')
  })

  it('speaks French', () => {
    const wrapper = mountChips(participant({ class_block: BLOCK }), 'fr')

    expect(wrapper.find('[data-testid="participant-chip-blocked-class"]').text()).toMatch(/classe/i)
  })
})
