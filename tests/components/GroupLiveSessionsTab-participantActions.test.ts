/**
 * The live wall carries the participant actions (#384).
 *
 * Each learner's tile gets the actions menu and the chips as an absolute
 * overlay on the tile wrapper — a sibling of the supervision viewer, never
 * inside its clickable surface, so nothing shifts and a click on the menu does
 * not focus the tile. The focused view carries the same menu in its header.
 * The wall reads the class's participant controls once per poll, whatever the
 * number of tiles. "Watch screen" on a tile focuses that tile.
 *
 * The wall knows the viewer through the `viewer` prop (and the class's
 * organisation through `organizationId`); without a viewer it shows no menu
 * and makes no read, as before.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'

const getGroupLiveSessions = vi.fn()
vi.mock('../../src/services/domain/terminal/supervisionService', () => ({
  supervisionService: {
    getGroupLiveSessions: (...args: unknown[]) => getGroupLiveSessions(...args)
  },
  buildSuperviseWsUrl: () => 'ws://test/supervise'
}))

const getParticipantControls = vi.fn()
const stopSessions = vi.fn()
const setNetwork = vi.fn()
const setClassBlock = vi.fn()
const setOrgBlock = vi.fn()
vi.mock('../../src/services/domain/terminal/participantControlsService', () => ({
  participantControlsService: {
    getParticipantControls: (...args: unknown[]) => getParticipantControls(...args),
    stopSessions: (...args: unknown[]) => stopSessions(...args),
    setNetwork: (...args: unknown[]) => setNetwork(...args),
    setClassBlock: (...args: unknown[]) => setClassBlock(...args),
    setOrgBlock: (...args: unknown[]) => setOrgBlock(...args)
  }
}))

vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn(), show: vi.fn() })
}))

import GroupLiveSessionsTab from '../../src/components/Groups/GroupLiveSessionsTab.vue'

const GROUP_ID = 'grp-1'
const ORG_ID = 'org-1'
const VIEWER = { userId: 'u-marc', isPlatformAdmin: false, managesClass: true, managesOrg: false }

const SupervisionViewerStub = {
  name: 'SupervisionViewer',
  props: ['sessionId', 'learnerName', 'compact'],
  emits: ['expand', 'activity'],
  template: '<div class="viewer-stub" role="button" :data-session-id="sessionId" @click="$emit(\'expand\')">{{ learnerName }}</div>'
}

const LIVE = [
  { session_id: 's-karim', user_id: 'u-karim', user_name: 'Karim' },
  { session_id: 's-lea', user_id: 'u-lea', user_name: 'Lea' },
  { session_id: 's-marc', user_id: 'u-marc', user_name: 'Marc' }
]

const CONTROLS = [
  { user_id: 'u-karim', user_name: 'Karim', role: 'member', class_block: null, org_blocked: false, global_block: false, network_cut: false,
    sessions: [{ session_id: 's-karim', state: 'running', network_feature: true, network_disabled: true, persistence_mode: 'persistent' }] },
  { user_id: 'u-lea', user_name: 'Lea', role: 'member',
    class_block: { reason: 'Exam' },
    org_blocked: false, global_block: false, network_cut: false,
    sessions: [{ session_id: 's-lea', state: 'running', network_feature: false, network_disabled: false, persistence_mode: 'persistent' }] },
  { user_id: 'u-marc', user_name: 'Marc', role: 'owner', class_block: null, org_blocked: false, global_block: false, network_cut: false,
    sessions: [{ session_id: 's-marc', state: 'running', network_feature: false, network_disabled: false, persistence_mode: 'persistent' }] }
]

async function mountWall(props: Record<string, unknown> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/classes/:id/live', name: 'ClassLive', component: { template: '<div />' } },
      { path: '/terminal-session/:sessionId', name: 'TerminalSessionView', component: { template: '<div />' } }
    ]
  })
  await router.push('/')
  await router.isReady()
  const wrapper = mount(GroupLiveSessionsTab, {
    props: { groupId: GROUP_ID, canSupervise: true, organizationId: ORG_ID, viewer: VIEWER, ...props },
    attachTo: document.body,
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false }), router],
      stubs: {
        SupervisionViewer: SupervisionViewerStub,
        BaseModal: {
          name: 'BaseModal',
          props: ['visible', 'title', 'size', 'showDefaultFooter', 'confirmText', 'cancelText'],
          emits: ['close', 'confirm'],
          template: '<div v-if="visible" class="base-modal-stub"><slot /><div class="base-modal-footer"><slot name="footer"><button v-if="showDefaultFooter && confirmText" type="button" class="base-modal-confirm" @click="$emit(\'confirm\')">{{ confirmText }}</button><button v-if="showDefaultFooter && cancelText" type="button" class="base-modal-cancel" @click="$emit(\'close\')">{{ cancelText }}</button></slot></div></div>'
        },
        AdminBadge: { name: 'AdminBadge', template: '<span />', props: ['iconOnly', 'tooltip'] }
      }
    }
  })
  await flushPromises()
  return wrapper
}

function tile(wrapper: VueWrapper, sessionId: string) {
  return wrapper.find(`.live-sessions-tile[data-session-id="${sessionId}"]`)
}

async function openTileMenu(wrapper: VueWrapper, sessionId: string) {
  const overlay = tile(wrapper, sessionId).find('[data-testid="tile-participant-actions"]')
  expect(overlay.exists(), `the ${sessionId} tile carries the actions overlay`).toBe(true)
  await overlay.find('.ocf-dropdown .dropdown-trigger').trigger('click')
  await flushPromises()
  return tile(wrapper, sessionId)
}

describe('GroupLiveSessionsTab — participant actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.body.innerHTML = ''
    getGroupLiveSessions.mockResolvedValue(LIVE)
    getParticipantControls.mockResolvedValue(CONTROLS)
    stopSessions.mockResolvedValue({ results: [{ session_id: 's-karim', ok: true }] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads the participant controls once per poll, whatever the number of tiles', async () => {
    vi.useFakeTimers()
    const wrapper = await mountWall()

    expect(getParticipantControls).toHaveBeenCalledTimes(1)
    expect(getParticipantControls).toHaveBeenCalledWith(GROUP_ID)

    await vi.advanceTimersByTimeAsync(30_000)
    await flushPromises()

    expect(getGroupLiveSessions).toHaveBeenCalledTimes(2)
    expect(getParticipantControls).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('puts the menu on each participant’s tile as an overlay beside the viewer, not inside it', async () => {
    const wrapper = await mountWall()

    for (const id of ['s-karim', 's-lea']) {
      const overlay = tile(wrapper, id).find('[data-testid="tile-participant-actions"]')
      expect(overlay.exists(), `${id} has the overlay`).toBe(true)
      expect(overlay.element.closest('.viewer-stub'), 'the overlay is not nested in the viewer').toBeNull()
      expect(overlay.find('.ocf-dropdown').exists()).toBe(true)
    }
  })

  it('shows no menu on the viewer’s own tile', async () => {
    const wrapper = await mountWall()

    expect(tile(wrapper, 's-marc').find('.ocf-dropdown').exists()).toBe(false)
  })

  it('shows the chips on the tile', async () => {
    const wrapper = await mountWall()

    expect(tile(wrapper, 's-karim').find('[data-testid="participant-chip-internet-off"]').exists()).toBe(true)
    expect(tile(wrapper, 's-lea').find('[data-testid="participant-chip-blocked-class"]').exists()).toBe(true)
  })

  it('opening the menu does not focus the tile', async () => {
    const wrapper = await mountWall()

    await openTileMenu(wrapper, 's-karim')

    expect(wrapper.find('.live-sessions-focused').exists()).toBe(false)
    expect(tile(wrapper, 's-karim').find('[data-testid="participant-action-stop"]').exists()).toBe(true)
  })

  it('focuses the tile on "Watch screen"', async () => {
    const wrapper = await mountWall()

    const karim = await openTileMenu(wrapper, 's-karim')
    await karim.find('[data-testid="participant-action-watch"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="open-session-page"]').attributes('href')).toBe(`/terminal-session/s-karim?group=${GROUP_ID}`)
  })

  it('stops a learner’s session from the tile, then reads the controls again', async () => {
    const wrapper = await mountWall()
    const karim = await openTileMenu(wrapper, 's-karim')

    await karim.find('[data-testid="participant-action-stop"]').trigger('click')
    await flushPromises()
    await wrapper.find('.base-modal-confirm').trigger('click')
    await flushPromises()

    expect(stopSessions).toHaveBeenCalledTimes(1)
    expect(stopSessions.mock.calls[0].slice(0, 2)).toEqual([GROUP_ID, 'u-karim'])
    expect(getParticipantControls).toHaveBeenCalledTimes(2)
  })

  it('carries the menu in the focused view’s header', async () => {
    const wrapper = await mountWall({ initialFocusSessionId: 's-karim' })

    const header = wrapper.find('.live-sessions-focused-actions')
    expect(header.exists()).toBe(true)
    await header.find('.ocf-dropdown .dropdown-trigger').trigger('click')
    await flushPromises()

    expect(header.find('[data-testid="participant-action-stop"]').exists()).toBe(true)
    // Already watching, and the page link is the header's own button.
    expect(header.find('[data-testid="participant-action-watch"]').exists()).toBe(false)
  })

  it('without a viewer, shows no menu and makes no read', async () => {
    const wrapper = await mountWall({ viewer: undefined })

    expect(getParticipantControls).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="tile-participant-actions"] .ocf-dropdown').exists()).toBe(false)
  })
})
