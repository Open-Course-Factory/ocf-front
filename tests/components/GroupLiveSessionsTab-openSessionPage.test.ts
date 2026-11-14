/**
 * The live wall's focused view leads to the learner's full session page (#385).
 *
 * Focusing a tile shows one learner's screen; from there "Open session page"
 * opens that learner's session page in supervisor mode:
 * `/terminal-session/<sessionId>?group=<classId>`. It is a real link (a
 * router-link), so it can be opened in a new tab and followed by the E2E
 * without a page.goto.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'

const getGroupLiveSessions = vi.fn()

vi.mock('../../src/services/domain/terminal/supervisionService', () => ({
  supervisionService: {
    getGroupLiveSessions: (...args: unknown[]) => getGroupLiveSessions(...args)
  },
  buildSuperviseWsUrl: () => 'ws://test/supervise'
}))

import GroupLiveSessionsTab from '../../src/components/Groups/GroupLiveSessionsTab.vue'

const GROUP_ID = 'grp-1'

/** A tile that can be focused the way the real one is: it emits `expand` on click. */
const SupervisionViewerStub = {
  name: 'SupervisionViewer',
  props: ['sessionId', 'learnerName', 'compact'],
  emits: ['expand', 'activity'],
  template: '<div class="viewer-stub" :data-session-id="sessionId" :data-compact="String(!!compact)" @click="$emit(\'expand\')">{{ learnerName }}</div>'
}

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

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/terminal-session/:sessionId', name: 'TerminalSessionView', component: { template: '<div />' } }
    ]
  })
}

async function mountTab(props: Record<string, unknown> = {}) {
  const router = createTestRouter()
  await router.push('/')
  await router.isReady()
  const wrapper = mount(GroupLiveSessionsTab, {
    props: { groupId: GROUP_ID, canSupervise: true, ...props },
    global: {
      plugins: [createTestI18n(), router],
      stubs: { SupervisionViewer: SupervisionViewerStub }
    }
  })
  await flushPromises()
  return wrapper
}

const sessions = [
  { session_id: 's1', user_id: 'u-1', user_name: 'Karim' },
  { session_id: 's2', user_id: 'u-2', user_name: 'Lea' }
]

describe('GroupLiveSessionsTab — focused view links to the session page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getGroupLiveSessions.mockResolvedValue(sessions)
  })

  it('links the focused learner to their session page in supervisor mode', async () => {
    const wrapper = await mountTab({ initialFocusSessionId: 's2' })

    const link = wrapper.find('[data-testid="open-session-page"]')
    expect(link.exists(), '[data-testid="open-session-page"] is rendered in the focused view').toBe(true)
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe('/terminal-session/s2?group=grp-1')
    expect(link.text()).toContain('Open session page')
  })

  it('follows the tile the trainer focused from the wall', async () => {
    const wrapper = await mountTab()
    // On the wall itself, no learner is singled out yet.
    expect(wrapper.find('[data-testid="open-session-page"]').exists()).toBe(false)

    await wrapper.find('.viewer-stub[data-session-id="s1"]').trigger('click')
    await flushPromises()

    const link = wrapper.find('[data-testid="open-session-page"]')
    expect(link.exists(), '[data-testid="open-session-page"] is rendered in the focused view').toBe(true)
    expect(link.attributes('href')).toBe('/terminal-session/s1?group=grp-1')
  })
})
