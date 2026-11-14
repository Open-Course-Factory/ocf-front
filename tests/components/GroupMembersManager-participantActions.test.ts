/**
 * The class members list carries the participant actions (#384).
 *
 * The participant items live in the row's existing ⋯ menu, beside "Regenerate
 * password" and "Remove", and the participant's chips sit in the name cell.
 * The whole list is fed by ONE read of GET /class-groups/:id/participant-controls
 * — never a request per row — reloaded after each action. A viewer who does
 * not manage the class gets neither the read nor the items.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import axios from 'axios'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}))

vi.mock('../../src/services/core/error', () => ({
  handleStoreError: (_err: any, fallbackKey: string) => fallbackKey
}))

vi.mock('../../src/services/domain/user', () => ({
  userService: { searchUsers: vi.fn().mockResolvedValue([]) }
}))

vi.mock('../../src/services/domain/bulkImport', () => ({
  bulkImportService: { regeneratePasswords: vi.fn().mockResolvedValue({ success: true, credentials: [], errors: [] }) }
}))

vi.mock('../../src/utils/formatters', () => ({
  formatDate: (date: string) => date
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userId: 'u-marc', isAdmin: false, isLoggedIn: true })
}))

const toastSuccess = vi.fn()
vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({ success: toastSuccess, warning: vi.fn(), error: vi.fn(), info: vi.fn(), show: vi.fn() })
}))

import GroupMembersManager from '../../src/components/Groups/GroupMembersManager.vue'

const GROUP_ID = 'test-group-id'
const CONTROLS_URL = `/class-groups/${GROUP_ID}/participant-controls`

const group = {
  id: GROUP_ID,
  name: 'test-group',
  display_name: 'Test Group',
  owner_user_id: 'u-marc',
  organization_id: 'org-1',
  is_active: true,
  max_members: 50,
  member_count: 3,
  is_full: false
}

const ROSTER = [
  { id: 'gm-marc', user_id: 'u-marc', role: 'owner', user: { id: 'u-marc', email: 'marc@example.com', display_name: 'Marc' } },
  { id: 'gm-sophie', user_id: 'u-sophie', role: 'manager', user: { id: 'u-sophie', email: 'sophie@example.com', display_name: 'Sophie' } },
  { id: 'gm-karim', user_id: 'u-karim', role: 'member', user: { id: 'u-karim', email: 'karim@example.com', display_name: 'Karim' } },
  { id: 'gm-lea', user_id: 'u-lea', role: 'member', user: { id: 'u-lea', email: 'lea@example.com', display_name: 'Lea' } }
]

const CONTROLS = [
  { user_id: 'u-marc', user_name: 'Marc', role: 'owner', class_block: null, org_blocked: false, global_block: false, network_cut: false, sessions: [] },
  { user_id: 'u-sophie', user_name: 'Sophie', role: 'manager', class_block: null, org_blocked: false, global_block: false, network_cut: false,
    sessions: [{ session_id: 's-sophie', state: 'running', network_feature: true, network_disabled: false, persistence_mode: 'persistent' }] },
  { user_id: 'u-karim', user_name: 'Karim', role: 'member', class_block: null, org_blocked: false, global_block: false, network_cut: true,
    sessions: [{ session_id: 's-karim', state: 'running', network_feature: true, network_disabled: true, persistence_mode: 'persistent' }] },
  { user_id: 'u-lea', user_name: 'Lea', role: 'member',
    class_block: { reason: 'Exam' },
    org_blocked: false, global_block: false, network_cut: false, sessions: [] }
]

function routeGets() {
  vi.mocked(axios.get).mockImplementation(async (url: string) => {
    if (url === '/group-members') return { data: { data: ROSTER } }
    if (url === CONTROLS_URL) return { data: CONTROLS }
    return { data: {} }
  })
}

function controlsReads() {
  return vi.mocked(axios.get).mock.calls.filter(([url]) => url === CONTROLS_URL)
}

function perParticipantCalls() {
  return [axios.get, axios.post, axios.put].flatMap(fn =>
    vi.mocked(fn).mock.calls.filter(([url]) => String(url).includes('/participants/'))
  )
}

async function mountList(props: Record<string, unknown> = {}) {
  setActivePinia(createPinia())
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/classes/:id/live', name: 'ClassLive', component: { template: '<div />' } },
      { path: '/classes/:id/scenarios', name: 'ClassScenarios', component: { template: '<div />' } },
      { path: '/terminal-session/:sessionId', name: 'TerminalSessionView', component: { template: '<div />' } }
    ]
  })
  await router.push('/')
  await router.isReady()
  const wrapper = mount(GroupMembersManager, {
    props: {
      groupId: GROUP_ID,
      group,
      canEditGroup: true,
      canNameOwner: true,
      isOwner: true,
      isOrgManager: false,
      isPlatformAdmin: false,
      subgroups: [],
      ...props
    },
    attachTo: document.body,
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false }), router],
      stubs: {
        BaseModal: {
          name: 'BaseModal',
          props: ['visible', 'title', 'size', 'isLoading', 'showDefaultFooter', 'confirmText', 'cancelText', 'confirmVariant', 'confirmTestId', 'cancelTestId'],
          emits: ['close', 'confirm'],
          template: '<div v-if="visible" class="base-modal-stub"><div class="base-modal-title">{{ title }}</div><slot /><div class="base-modal-footer"><slot name="footer"><button v-if="showDefaultFooter && confirmText" type="button" :class="[\'base-modal-confirm\', confirmVariant === \'danger\' ? \'btn-danger\' : \'btn-primary\']" :data-testid="confirmTestId" @click="$emit(\'confirm\')">{{ confirmText }}</button><button v-if="showDefaultFooter && cancelText" type="button" class="base-modal-cancel" :data-testid="cancelTestId" @click="$emit(\'close\')">{{ cancelText }}</button></slot></div></div>'
        },
        AdminBadge: { name: 'AdminBadge', template: '<span class="admin-badge-stub" />', props: ['iconOnly', 'tooltip'] }
      }
    }
  })
  await flushPromises()
  return wrapper
}

function row(wrapper: VueWrapper, name: string) {
  const found = wrapper.findAll('[data-testid="member-row"]').find(r => r.find('.ocf-member-row__name').text() === name)
  expect(found, `a row for ${name}`).toBeTruthy()
  return found!
}

async function openRowMenu(wrapper: VueWrapper, name: string) {
  const trigger = row(wrapper, name).find('.ocf-dropdown .dropdown-trigger')
  expect(trigger.exists(), `${name}'s row has its ⋯ menu`).toBe(true)
  await trigger.trigger('click')
  await flushPromises()
  return row(wrapper, name)
}

describe('GroupMembersManager — participant actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    routeGets()
    vi.mocked(axios.post).mockResolvedValue({ data: { results: [{ session_id: 's-karim', ok: true }] } })
    vi.mocked(axios.put).mockResolvedValue({ data: {} })
  })

  it('reads the participants’ controls once for the whole list', async () => {
    await mountList()

    expect(controlsReads()).toHaveLength(1)
    expect(perParticipantCalls()).toHaveLength(0)
  })

  it('puts the participant items in the row’s existing menu, beside its own', async () => {
    const wrapper = await mountList()

    const karim = await openRowMenu(wrapper, 'Karim')

    expect(karim.findAll('.ocf-dropdown')).toHaveLength(1)
    const menu = karim.find('.ocf-dropdown-menu')
    expect(menu.find('[data-testid="member-regenerate-password"]').exists()).toBe(true)
    expect(menu.find('[data-testid="participant-action-stop"]').exists()).toBe(true)
    expect(menu.find('[data-testid="participant-action-restore-internet"]').exists()).toBe(true)
    expect(menu.find('[data-testid="participant-action-block-class"]').exists()).toBe(true)
  })

  it('offers no participant item on a trainer’s row', async () => {
    const wrapper = await mountList()

    const sophieRow = row(wrapper, 'Sophie')
    const trigger = sophieRow.find('.ocf-dropdown .dropdown-trigger')
    if (trigger.exists()) {
      await trigger.trigger('click')
      await flushPromises()
    }
    expect(row(wrapper, 'Sophie').find('[data-testid^="participant-action-"]').exists()).toBe(false)
  })

  it('shows the participant’s chips in the name cell', async () => {
    const wrapper = await mountList()

    const karimName = row(wrapper, 'Karim').find('.ocf-member-row__name').element.parentElement!
    expect(karimName.querySelector('[data-testid="participant-chip-internet-off"]')).not.toBeNull()

    const leaName = row(wrapper, 'Lea').find('.ocf-member-row__name').element.parentElement!
    expect(leaName.querySelector('[data-testid="participant-chip-blocked-class"]')).not.toBeNull()
  })

  it('reserves the chips slot in every name cell before the controls arrive, and keeps it after', async () => {
    let release!: () => void
    const controlsArrive = new Promise<void>(resolve => { release = resolve })
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (url === '/group-members') return { data: { data: ROSTER } }
      if (url === CONTROLS_URL) {
        await controlsArrive
        return { data: CONTROLS }
      }
      return { data: {} }
    })

    const wrapper = await mountList()

    for (const name of ['Marc', 'Sophie', 'Karim', 'Lea']) {
      const cell = row(wrapper, name).find('.ocf-member-row__name').element.parentElement!
      const slot = cell.querySelector('[data-testid="participant-chips-slot"]')
      expect(slot, `${name}'s name cell reserves the chips slot before the read resolves`).not.toBeNull()
      expect(slot!.querySelector('[data-testid^="participant-chip-"]')).toBeNull()
    }
    const karimSlotBefore = row(wrapper, 'Karim').find('[data-testid="participant-chips-slot"]').element
    const classBefore = karimSlotBefore.className

    release()
    await flushPromises()

    const karimSlot = row(wrapper, 'Karim').find('[data-testid="participant-chips-slot"]')
    expect(karimSlot.exists()).toBe(true)
    expect(karimSlot.element.className, 'same box, empty or filled').toBe(classBefore)
    expect(karimSlot.find('[data-testid="participant-chip-internet-off"]').exists()).toBe(true)
  })

  it('stops a participant’s session after a confirmation, then reads the list again', async () => {
    const wrapper = await mountList()
    const karim = await openRowMenu(wrapper, 'Karim')

    await karim.find('[data-testid="participant-action-stop"]').trigger('click')
    await flushPromises()
    expect(axios.post).not.toHaveBeenCalled()

    await wrapper.find('[data-testid="participant-confirm"]').trigger('click')
    await flushPromises()

    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(vi.mocked(axios.post).mock.calls[0][0]).toBe(`/class-groups/${GROUP_ID}/participants/u-karim/stop-sessions`)
    expect(controlsReads()).toHaveLength(2)
    expect(toastSuccess).toHaveBeenCalledTimes(1)
  })

  it('blocks in the class with the reason typed', async () => {
    const wrapper = await mountList()
    const karim = await openRowMenu(wrapper, 'Karim')

    await karim.find('[data-testid="participant-action-block-class"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="participant-block-reason"]').setValue('Exam in progress')
    await wrapper.find('[data-testid="participant-confirm"]').trigger('click')
    await flushPromises()

    expect(axios.put).toHaveBeenCalledWith(
      `/class-groups/${GROUP_ID}/participants/u-karim/session-block`,
      { blocked: true, reason: 'Exam in progress', stop_running: true },
      expect.objectContaining({ timeout: 120000 })
    )
  })

  it('offers the organisation block to an organisation manager', async () => {
    const wrapper = await mountList({ isOrgManager: true })
    const karim = await openRowMenu(wrapper, 'Karim')

    expect(karim.find('[data-testid="participant-action-block-org"]').exists()).toBe(true)
  })

  it('withholds the organisation block from a class owner who does not manage the organisation', async () => {
    const wrapper = await mountList({ isOrgManager: false })
    const karim = await openRowMenu(wrapper, 'Karim')

    expect(karim.find('[data-testid="participant-action-block-org"]').exists()).toBe(false)
  })

  it('gives a viewer who does not manage the class neither the read nor the items', async () => {
    const wrapper = await mountList({ canEditGroup: false, canNameOwner: false, isOwner: false })

    expect(controlsReads()).toHaveLength(0)
    expect(wrapper.find('[data-testid^="participant-action-"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid^="participant-chip-"]').exists()).toBe(false)
  })
})
