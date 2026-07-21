/**
 * Tests for GroupLiveSessionsTab's permission gate vs. the async prop it depends on.
 *
 * `canSupervise` comes from the parent's async members-list load, so on the first
 * tick it is often still false. `loadSessions()` early-returns with the "no
 * permission" banner when it's false — and nothing re-runs it when the prop later
 * flips to true. The learner stares at "Vous n'avez pas la permission…" until the
 * 30s poll or a manual refresh, even though supervision is in fact allowed.
 *
 * Contract pinned here:
 *   - mount with canSupervise=false → permission banner shown, service NOT called.
 *   - prop flips to true → the component loads sessions on its own and the banner
 *     clears WITHOUT any manual refresh.
 *   - a real 403 rejection from the service still shows the permission banner
 *     (the legitimate denial that must survive the fix).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'

const getGroupLiveSessions = vi.fn()

vi.mock('../../src/services/domain/terminal/supervisionService', () => ({
  supervisionService: {
    getGroupLiveSessions: (...args: unknown[]) => getGroupLiveSessions(...args)
  },
  buildSuperviseWsUrl: () => 'ws://test/supervise'
}))

import GroupLiveSessionsTab from '../../src/components/Groups/GroupLiveSessionsTab.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

function mountTab(props: Record<string, unknown> = {}) {
  return mount(GroupLiveSessionsTab, {
    props: {
      groupId: 'grp-1',
      canSupervise: false,
      ...props
    },
    global: {
      plugins: [createTestI18n()],
      stubs: {
        SupervisionViewer: true
      }
    }
  })
}

async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
}

const PERMISSION_TEXT = /permission/i

describe('GroupLiveSessionsTab — permission gate vs. async canSupervise', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getGroupLiveSessions.mockResolvedValue([])
  })

  it('shows the permission banner and does not call the service when canSupervise is false', async () => {
    const wrapper = mountTab({ canSupervise: false })
    await flushPromises()

    expect(wrapper.find('.live-sessions-error').text()).toMatch(PERMISSION_TEXT)
    expect(getGroupLiveSessions).not.toHaveBeenCalled()
  })

  it('loads sessions and clears the banner when canSupervise flips to true, without a manual refresh', async () => {
    const wrapper = mountTab({ canSupervise: false })
    await flushPromises()
    expect(wrapper.find('.live-sessions-error').exists()).toBe(true)

    await wrapper.setProps({ canSupervise: true })
    await flushPromises()

    expect(getGroupLiveSessions).toHaveBeenCalledWith('grp-1')
    expect(wrapper.find('.live-sessions-error').exists()).toBe(false)
  })

  it('shows the permission banner on a real 403 rejection from the service', async () => {
    getGroupLiveSessions.mockRejectedValueOnce({
      response: { status: 403, data: { error_message: 'Supervision requires a higher plan' } }
    })

    const wrapper = mountTab({ canSupervise: true })
    await flushPromises()

    expect(getGroupLiveSessions).toHaveBeenCalledWith('grp-1')
    expect(wrapper.find('.live-sessions-error').text()).toContain('Supervision requires a higher plan')
  })
})
