/**
 * The supervision wall marks the learners held at the teacher's step gate, so
 * the teacher sees who is waiting for the next step to open. The wall reads it
 * from the class progress endpoint, joined on the learner's user id; when that
 * call fails the wall still shows, without the marks.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const getGroupLiveSessions = vi.fn()
const getGroupLiveProgress = vi.fn()

vi.mock('../../src/services/domain/terminal/supervisionService', () => ({
  supervisionService: {
    getGroupLiveSessions: (...args: unknown[]) => getGroupLiveSessions(...args)
  },
  buildSuperviseWsUrl: () => 'ws://test/supervise'
}))

vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    getGroupLiveProgress: (...args: unknown[]) => getGroupLiveProgress(...args)
  }
}))

import GroupLiveSessionsTab from '../../src/components/Groups/GroupLiveSessionsTab.vue'

function progressRow(userId: string, waiting: boolean[]) {
  return {
    user_id: userId,
    connected: true,
    idle: false,
    assignments: waiting.map((w, i) => ({
      assignment_id: `a-${i}`,
      scenario_id: `sc-${i}`,
      scenario_title: 'Lab',
      status: 'in_progress',
      current_step: 2,
      total_steps: 4,
      hints_used: 0,
      waiting_at_gate: w
    }))
  }
}

function mountTab() {
  return mount(GroupLiveSessionsTab, {
    props: { groupId: 'grp-1', canSupervise: true },
    global: {
      plugins: [createI18n({
        legacy: false, locale: 'en', fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false
      })],
      stubs: { SupervisionViewer: true }
    }
  })
}

function waitingByTile(wrapper: ReturnType<typeof mountTab>) {
  return wrapper.findAll('.live-sessions-tile').map(tile => tile.find('.ocf-wall-waiting').exists())
}

describe('GroupLiveSessionsTab — learners waiting at the step gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getGroupLiveSessions.mockResolvedValue([
      { session_id: 's-1', user_id: 'u-1', user_name: 'Léa' },
      { session_id: 's-2', user_id: 'u-2', user_name: 'Karim' }
    ])
  })

  it('marks the tile of a learner waiting on any of their assignments', async () => {
    getGroupLiveProgress.mockResolvedValue([
      progressRow('u-1', [false, true]),
      progressRow('u-2', [false])
    ])
    const wrapper = mountTab()
    await flushPromises()

    expect(getGroupLiveProgress).toHaveBeenCalledWith('grp-1')
    expect(waitingByTile(wrapper)).toEqual([true, false])
    const badge = wrapper.find('.ocf-wall-waiting')
    expect(badge.text()).toBe('Waiting')
    expect(badge.attributes('title')).toBe('Waiting for you to open the next step')
  })

  it('marks nobody when no learner is waiting', async () => {
    getGroupLiveProgress.mockResolvedValue([progressRow('u-1', [false]), progressRow('u-2', [])])
    const wrapper = mountTab()
    await flushPromises()

    expect(waitingByTile(wrapper)).toEqual([false, false])
  })

  it('still shows the wall, without marks, when the progress call fails', async () => {
    getGroupLiveProgress.mockRejectedValue({ response: { status: 500 } })
    const wrapper = mountTab()
    await flushPromises()

    expect(waitingByTile(wrapper)).toEqual([false, false])
    expect(wrapper.find('.live-sessions-error').exists()).toBe(false)
  })
})
