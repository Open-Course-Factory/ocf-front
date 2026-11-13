/**
 * The class member list: trainers (owners, managers) sit apart from the
 * participants and can never be ticked, so a bulk password reset only reaches
 * participants; removing a member asks first; the selection only holds rows
 * the search leaves visible, and a sort change keeps it.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: [] } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
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
  bulkImportService: {
    regeneratePasswords: vi.fn().mockResolvedValue({ success: true, credentials: [], errors: [] })
  }
}))

vi.mock('../../src/utils/formatters', () => ({
  formatDate: (date: string) => date
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userId: 'current-user-id', isAdmin: false, isLoggedIn: true })
}))

import GroupMembersManager from '../../src/components/Groups/GroupMembersManager.vue'
import { bulkImportService } from '../../src/services/domain/bulkImport'

const group = {
  id: 'test-group-id',
  name: 'test-group',
  display_name: 'Test Group',
  owner_user_id: 'owner-1',
  organization_id: 'org-1',
  is_active: true,
  max_members: 50,
  member_count: 6,
  is_full: false
}

// A co-owner who is not group.owner_user_id is still a trainer.
const roster = [
  { id: 'gm-p1', user_id: 'p-zoe', role: 'member', user: { id: 'p-zoe', email: 'zoe@example.com', display_name: 'Zoe Participant' } },
  { id: 'gm-owner', user_id: 'owner-1', role: 'owner', user: { id: 'owner-1', email: 'owner@example.com', display_name: 'Creator' } },
  { id: 'gm-p2', user_id: 'p-alice', role: 'member', user: { id: 'p-alice', email: 'alice@example.com', display_name: 'Alice Participant' } },
  { id: 'gm-coowner', user_id: 'coowner-1', role: 'owner', user: { id: 'coowner-1', email: 'coowner@example.com', display_name: 'Co Owner' } },
  { id: 'gm-p3', user_id: 'p-bob', role: 'member', user: { id: 'p-bob', email: 'bob@example.com', display_name: 'Bob Participant' } },
  { id: 'gm-mgr', user_id: 'mgr-1', role: 'manager', user: { id: 'mgr-1', email: 'mgr@example.com', display_name: 'Manny Manager' } }
]

const TRAINERS = ['Creator', 'Co Owner', 'Manny Manager']
const PARTICIPANTS = ['Zoe Participant', 'Alice Participant', 'Bob Participant']

async function mountRoster() {
  setActivePinia(createPinia())
  vi.mocked(axios.get).mockResolvedValueOnce({ data: { data: structuredClone(roster) } })
  const wrapper = mount(GroupMembersManager, {
    props: {
      groupId: 'test-group-id',
      group,
      canEditGroup: true,
      canNameOwner: true,
      isOwner: true,
      isPlatformAdmin: false,
      subgroups: []
    },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        // Honours `visible` and renders the footer, so a confirm dialog can be
        // seen opening and its buttons clicked.
        BaseModal: {
          template: '<div v-if="visible" class="base-modal-stub"><slot /><div class="base-modal-footer"><slot name="footer" /></div></div>',
          props: ['visible', 'title', 'size', 'isLoading', 'showDefaultFooter', 'confirmText', 'cancelText']
        },
        AdminBadge: { template: '<span />', props: ['iconOnly', 'tooltip'] },
        RouterLink: { template: '<a><slot /></a>', props: ['to'] }
      }
    }
  })
  await flushPromises()
  return wrapper
}

function rowOf(wrapper: VueWrapper, name: string) {
  const row = wrapper.findAll('[data-testid="member-row"]').find(r => r.text().includes(name))
  expect(row, `row for ${name}`).toBeDefined()
  return row!
}

function bulkBarText(wrapper: VueWrapper) {
  return wrapper.find('[data-testid="members-bulk-bar"]').text()
}

// "Remove" sits in the row's ⋯ actions menu: open it, then pick the item.
async function clickRemove(wrapper: VueWrapper, name: string) {
  await rowOf(wrapper, name).find('.member-actions .btn-icon').trigger('click')
  await rowOf(wrapper, name).find('[data-testid="member-remove"]').trigger('click')
}

async function tick(wrapper: VueWrapper, name: string) {
  await rowOf(wrapper, name).find('input.member-checkbox').setValue(true)
}

beforeEach(() => {
  vi.mocked(axios.delete).mockClear()
  vi.mocked(bulkImportService.regeneratePasswords).mockClear()
})

describe('GroupMembersManager trainers and participants', () => {
  it('lists the trainers first, then the participants, each under its own heading', async () => {
    const wrapper = await mountRoster()

    const html = wrapper.html()
    const trainersHeading = wrapper.find('[data-testid="members-group-trainers"]')
    const participantsHeading = wrapper.find('[data-testid="members-group-participants"]')
    expect(trainersHeading.exists()).toBe(true)
    expect(participantsHeading.exists()).toBe(true)

    // Document order: trainers heading, trainer rows, participants heading, participant rows.
    const pos = (s: string) => html.indexOf(s)
    const trainersAt = pos('data-testid="members-group-trainers"')
    const participantsAt = pos('data-testid="members-group-participants"')
    expect(trainersAt).toBeLessThan(participantsAt)
    for (const name of TRAINERS) {
      expect(pos(name)).toBeGreaterThan(trainersAt)
      expect(pos(name)).toBeLessThan(participantsAt)
    }
    for (const name of PARTICIPANTS) {
      expect(pos(name)).toBeGreaterThan(participantsAt)
    }
  })

  it('offers no checkbox on an owner, a co-owner or a manager row', async () => {
    const wrapper = await mountRoster()

    for (const name of TRAINERS) {
      expect(rowOf(wrapper, name).find('input.member-checkbox').exists(), name).toBe(false)
    }
    for (const name of PARTICIPANTS) {
      expect(rowOf(wrapper, name).find('input.member-checkbox').exists(), name).toBe(true)
    }
  })

  it('select-all ticks the participants only, and the password reset reaches only them', async () => {
    const wrapper = await mountRoster()
    window.confirm = vi.fn(() => true)

    await wrapper.find('.select-all-checkbox input').setValue(true)
    expect(bulkBarText(wrapper)).toContain('3 selected')

    await wrapper.find('[data-testid="regenerate-passwords"]').trigger('click')
    await flushPromises()

    expect(bulkImportService.regeneratePasswords).toHaveBeenCalledTimes(1)
    const sentIds = vi.mocked(bulkImportService.regeneratePasswords).mock.calls[0][2]
    expect([...sentIds].sort()).toEqual(['p-alice', 'p-bob', 'p-zoe'])
  })
})

describe('GroupMembersManager member removal', () => {
  it('asks before removing: the remove action opens a confirmation and deletes nothing', async () => {
    const wrapper = await mountRoster()

    expect(wrapper.find('[data-testid="member-remove-confirm"]').exists()).toBe(false)
    await clickRemove(wrapper, 'Bob Participant')

    expect(wrapper.find('[data-testid="member-remove-confirm"]').exists()).toBe(true)
    expect(axios.delete).not.toHaveBeenCalled()
    expect(wrapper.emitted('member-count-changed')).toBeUndefined()
  })

  it('removes the member once confirmed and reports one member fewer', async () => {
    const wrapper = await mountRoster()

    await clickRemove(wrapper, 'Bob Participant')
    await wrapper.find('[data-testid="member-remove-confirm"]').trigger('click')
    await flushPromises()

    expect(axios.delete).toHaveBeenCalledTimes(1)
    expect(axios.delete).toHaveBeenCalledWith('/group-members/gm-p3')
    expect(wrapper.emitted('member-count-changed')).toEqual([[-1]])
    expect(wrapper.findAll('[data-testid="member-row"]').some(r => r.text().includes('Bob Participant'))).toBe(false)
    expect(wrapper.find('[data-testid="member-remove-confirm"]').exists()).toBe(false)
  })

  it('removes nothing when the trainer cancels', async () => {
    const wrapper = await mountRoster()

    await clickRemove(wrapper, 'Bob Participant')
    const cancel = wrapper.find('.base-modal-footer').findAll('button').find(b => b.text() === 'Cancel')
    expect(cancel).toBeDefined()
    await cancel!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="member-remove-confirm"]').exists()).toBe(false)
    expect(axios.delete).not.toHaveBeenCalled()
    expect(wrapper.emitted('member-count-changed')).toBeUndefined()
    expect(rowOf(wrapper, 'Bob Participant').exists()).toBe(true)
  })
})

describe('GroupMembersManager selection across search and sort', () => {
  it('drops a row the search hides from the selection, and keeps it across a sort change', async () => {
    const wrapper = await mountRoster()

    await tick(wrapper, 'Alice Participant')
    await tick(wrapper, 'Bob Participant')
    expect(bulkBarText(wrapper)).toContain('2 selected')

    await wrapper.find('input.search-input').setValue('alice')
    await flushPromises()
    expect(bulkBarText(wrapper)).toContain('1 selected')

    await wrapper.find('[data-testid="members-sort"]').trigger('click')
    await flushPromises()
    expect(bulkBarText(wrapper)).toContain('1 selected')
    expect((rowOf(wrapper, 'Alice Participant').find('input.member-checkbox').element as HTMLInputElement).checked).toBe(true)
  })
})
