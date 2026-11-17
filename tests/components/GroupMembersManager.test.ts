import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, getActivePinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import axios from 'axios'

// Mock axios before any imports that use it
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: [] } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}))

// Mock the error handler used by withAsync
vi.mock('../../src/services/core/error', () => ({
  handleStoreError: (err: any, fallbackKey: string) => fallbackKey
}))

// Mock userService
vi.mock('../../src/services/domain/user', () => ({
  userService: {
    searchUsers: vi.fn().mockResolvedValue([])
  }
}))

// Mock bulkImportService
vi.mock('../../src/services/domain/bulkImport', () => ({
  bulkImportService: {
    regeneratePasswords: vi.fn().mockResolvedValue({
      success: true,
      credentials: [],
      errors: []
    })
  }
}))

// Mock the currentUser store
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    userId: 'current-user-id',
    isAdmin: false,
    isLoggedIn: true
  })
}))

import GroupMembersManager from '../../src/components/Groups/GroupMembersManager.vue'
import { bulkImportService } from '../../src/services/domain/bulkImport'
import { sanitizeCSVField } from '../../src/utils/csv'
import { userService } from '../../src/services/domain/user'

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

const defaultGroup = {
  id: 'test-group-id',
  name: 'test-group',
  display_name: 'Test Group',
  owner_user_id: 'owner-1',
  organization_id: 'org-1',
  is_active: true,
  max_members: 50,
  member_count: 1,
  is_full: false
}

function mountComponent(propsOverrides: Record<string, unknown> = {}, locale: 'en' | 'fr' = 'en') {
  const i18n = createTestI18n(locale)
  setActivePinia(createPinia())

  return mount(GroupMembersManager, {
    props: {
      groupId: 'test-group-id',
      group: defaultGroup,
      canEditGroup: true,
      canNameOwner: false,
      isOwner: false,
      isPlatformAdmin: false,
      subgroups: [],
      ...propsOverrides
    },
    global: {
      plugins: [i18n],
      stubs: {
        // Honours `visible` and renders the title and footer, so a dialog can be
        // seen opening, read, and its buttons clicked. Like the real one, it
        // swaps its content out while `isLoading`.
        BaseModal: {
          name: 'BaseModal',
          template: '<div v-if="visible" class="base-modal-stub"><div class="base-modal-title">{{ title }}</div><slot v-if="!isLoading" /><div class="base-modal-footer"><slot name="footer" /></div></div>',
          props: ['visible', 'title', 'size', 'isLoading', 'showDefaultFooter',
                  'confirmText', 'cancelText']
        },
        AdminBadge: {
          name: 'AdminBadge',
          template: '<span class="admin-badge-stub" />',
          props: ['iconOnly', 'tooltip']
        },
        RouterLink: {
          template: '<a class="router-link-stub"><slot /></a>',
          props: ['to']
        }
      }
    }
  })
}

describe('GroupMembersManager', () => {
  // A co-trainer (class manager) manages the class like its creator, but ranks
  // below an owner: ocf-core refuses a grant above the caller's own rank.
  async function mountWithRoster(propsOverrides: Record<string, unknown>) {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        data: [
          { id: 'gm-owner', user_id: 'owner-1', role: 'owner', user: { id: 'owner-1', email: 'owner@example.com', display_name: 'Creator' } },
          { id: 'gm-1', user_id: 'other-user', role: 'member', user: { id: 'other-user', email: 'other@example.com', display_name: 'Other User' } }
        ]
      }
    })
    const wrapper = mountComponent(propsOverrides)
    await flushPromises()
    return wrapper
  }

  async function openAddModal(wrapper: VueWrapper) {
    await wrapper.find('[data-test="add-member"]').trigger('click')
    return wrapper.find('.base-modal-stub')
  }

  async function addModalRoleOptions(wrapper: VueWrapper) {
    return (await openAddModal(wrapper)).find('select.form-control').findAll('option').map(o => o.attributes('value'))
  }

  function addMemberButton(wrapper: VueWrapper) {
    return wrapper.find('[data-test="add-member"]')
  }

  describe('a class co-trainer', () => {
    const coTrainer = { canEditGroup: true, canNameOwner: false, isOwner: false }

    it('sees the member management controls', async () => {
      const wrapper = await mountWithRoster(coTrainer)

      expect(addMemberButton(wrapper).exists()).toBe(true)
      expect(wrapper.find('[data-test="bulk-scenario-link"]').exists()).toBe(true)
      expect(wrapper.find('.select-all-checkbox').exists()).toBe(true)
      expect(wrapper.findAll('select.role-select')).toHaveLength(1)
    })

    it('is offered member and manager, never owner', async () => {
      const wrapper = await mountWithRoster(coTrainer)

      expect(await addModalRoleOptions(wrapper)).toEqual(['member', 'manager'])
      const editOptions = wrapper.find('select.role-select').findAll('option').map(o => o.attributes('value'))
      expect(editOptions).toEqual(['manager', 'member'])
    })

    it('is not offered a change of the class creator\'s role', async () => {
      const wrapper = await mountWithRoster(coTrainer)

      const creatorCard = wrapper.findAll('[data-testid="member-row"]').find(card => card.text().includes('Creator'))!
      expect(creatorCard.find('select.role-select').exists()).toBe(false)
    })
  })

  describe('someone who ranks as class owner', () => {
    it('may name an owner, when adding or editing a member', async () => {
      const wrapper = await mountWithRoster({ canEditGroup: true, canNameOwner: true, isOwner: false })

      expect(await addModalRoleOptions(wrapper)).toContain('owner')
      const editOptions = wrapper.find('select.role-select').findAll('option').map(o => o.attributes('value'))
      expect(editOptions).toContain('owner')
    })

    it('shows the platform-admin marker on the owner option of an admin', async () => {
      const wrapper = await mountWithRoster({ canEditGroup: true, canNameOwner: true, isPlatformAdmin: true })

      const ownerOption = (await openAddModal(wrapper)).find('option[value="owner"]')
      expect(ownerOption.text()).toContain('🛡️')
    })
  })

  describe('a plain class member', () => {
    it('sees no management control', async () => {
      const wrapper = await mountWithRoster({ canEditGroup: false, canNameOwner: false, isOwner: false })

      expect(addMemberButton(wrapper).exists()).toBe(false)
      expect(wrapper.find('[data-test="bulk-scenario-link"]').exists()).toBe(false)
      expect(wrapper.find('.select-all-checkbox').exists()).toBe(false)
      expect(wrapper.find('.member-checkbox').exists()).toBe(false)
      expect(wrapper.find('select.role-select').exists()).toBe(false)
      expect(wrapper.find('.member-actions').exists()).toBe(false)
    })
  })

  describe('AdminBadge visibility', () => {
    it('renders AdminBadge in toolbar when isPlatformAdmin is true and isOwner is false', async () => {
      const wrapper = mountComponent({ isPlatformAdmin: true, isOwner: false })
      await nextTick()

      // The toolbar AdminBadge is rendered when isPlatformAdmin && !isOwner
      const toolbarActions = wrapper.find('.toolbar-actions')
      const adminBadges = toolbarActions.findAllComponents({ name: 'AdminBadge' })
      expect(adminBadges.length).toBeGreaterThanOrEqual(1)
    })

    it('does not render toolbar AdminBadge when isPlatformAdmin is true but isOwner is also true', async () => {
      const wrapper = mountComponent({ isPlatformAdmin: true, isOwner: true })
      await nextTick()

      // The toolbar AdminBadge condition is: isPlatformAdmin && !isOwner
      // So when isOwner is true, the toolbar badge should not appear.
      const toolbarActions = wrapper.find('.toolbar-actions')
      const adminBadges = toolbarActions.findAllComponents({ name: 'AdminBadge' })
      expect(adminBadges.length).toBe(0)
    })

    it('does not render any AdminBadge when isPlatformAdmin is false', async () => {
      const wrapper = mountComponent({ isPlatformAdmin: false, isOwner: false })
      await nextTick()

      // Neither toolbar nor modal AdminBadge should render
      const allAdminBadges = wrapper.findAllComponents({ name: 'AdminBadge' })
      expect(allAdminBadges.length).toBe(0)
    })

    // TODO: AdminBadge inside the modal label (v-if="isPlatformAdmin") is not testable
    // with the current happy-dom setup because the label element's inline children are
    // not reliably preserved by happy-dom's HTML parser. The toolbar AdminBadge tests
    // above verify the conditional rendering logic correctly.
  })

  describe('loading and empty states', () => {
    it('shows empty state when no members loaded', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      // After loading completes with empty data, the empty state shows,
      // translated, in place of the table.
      const emptyState = wrapper.find('.empty-state')
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toBe('No members in this group')
      expect(wrapper.find('[data-testid="member-row"]').exists()).toBe(false)
    })
  })

  describe('add member user search', () => {
    // The dropdown used to render only while a search was running or had
    // results, so the "no user found" branch inside it could never show: a
    // teacher searching a mistyped email got silence.
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    async function searchFor(query: string) {
      const wrapper = mountComponent()
      await nextTick()
      await wrapper.find('[data-test="add-member"]').trigger('click')
      const input = wrapper.find('.base-modal-stub').find('.user-search-container input')
      await input.trigger('focus')
      await input.setValue(query)
      // Past the search debounce, so the search has completed.
      await vi.advanceTimersByTimeAsync(350)
      await flushPromises()
      return wrapper
    }

    it('tells the teacher when a completed search matched nobody', async () => {
      const wrapper = await searchFor('nobody@example.com')
      expect(wrapper.find('.search-empty').exists()).toBe(true)
      expect(wrapper.find('.search-empty').text()).toBe('No user found')
    })

    it('stays silent while the query is too short to search', async () => {
      const wrapper = await searchFor('a')
      expect(wrapper.find('.search-dropdown').exists()).toBe(false)
    })
  })

  describe('add member: the picked user never outlives its query', () => {
    const alice = { id: 'alice-id', name: 'alice', display_name: 'Alice', email: 'alice@example.com' }
    const results = (q: string) => (q.toLowerCase().startsWith('al') ? [alice] : [])

    beforeEach(() => {
      // Only the timers: the search may be debounced, the dropdown hides on a timer.
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      vi.mocked(userService.searchUsers).mockImplementation(async (q: string) => results(q))
      vi.mocked(axios.get).mockImplementation(async (url: string, config?: any) =>
        url === '/users/search' ? { data: results(config?.params?.q ?? '') } : { data: { data: [] } }
      )
      vi.mocked(axios.post).mockClear()
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.mocked(userService.searchUsers).mockReset().mockResolvedValue([])
      vi.mocked(axios.get).mockReset().mockResolvedValue({ data: { data: [] } })
    })

    function addModal(wrapper: VueWrapper) {
      return wrapper.findAllComponents({ name: 'BaseModal' }).find(m => m.props('visible') && m.props('confirmText') === 'Add Member')!
    }

    async function settle() {
      await vi.advanceTimersByTimeAsync(1000)
      await flushPromises()
    }

    async function type(wrapper: VueWrapper, query: string) {
      const input = wrapper.find('.base-modal-stub .user-search-container input')
      await input.trigger('focus')
      await input.setValue(query)
      await settle()
    }

    async function pickAlice(wrapper: VueWrapper) {
      await type(wrapper, 'ali')
      await wrapper.find('.base-modal-stub .search-result').trigger('click')
      await settle()
    }

    function postedMembers() {
      return vi.mocked(axios.post).mock.calls.filter(([url]) => url === '/group-members')
    }

    async function mountOpen() {
      const wrapper = mountComponent()
      await flushPromises()
      await wrapper.find('[data-test="add-member"]').trigger('click')
      return wrapper
    }

    it('adds the user the trainer picked', async () => {
      const wrapper = await mountOpen()
      await pickAlice(wrapper)

      addModal(wrapper).vm.$emit('confirm')
      await settle()

      expect(postedMembers()).toHaveLength(1)
      expect(postedMembers()[0][1]).toMatchObject({ user_id: 'alice-id' })
    })

    it('does not add a user picked before the dialog was cancelled', async () => {
      const wrapper = await mountOpen()
      await pickAlice(wrapper)
      addModal(wrapper).vm.$emit('close')
      await settle()

      // Untouched text: typing would clear the id by itself and hide a missing reset.
      await wrapper.find('[data-test="add-member"]').trigger('click')
      addModal(wrapper).vm.$emit('confirm')
      await settle()

      expect(postedMembers()).toEqual([])
    })

    it('does not add a user picked before the query was retyped', async () => {
      const wrapper = await mountOpen()
      await pickAlice(wrapper)

      await type(wrapper, 'bob')
      addModal(wrapper).vm.$emit('confirm')
      await settle()

      expect(postedMembers()).toEqual([])
    })

    // The input lost its native `required`: this message is the only guard left.
    it('asks for a user when the trainer typed a query but picked nobody', async () => {
      const wrapper = await mountOpen()
      await type(wrapper, 'bob')

      addModal(wrapper).vm.$emit('confirm')
      await settle()

      expect(postedMembers()).toEqual([])
      expect(wrapper.find('.base-modal-stub .alert-danger').text()).toBe('User ID is required')
    })

    // RED ON PURPOSE (defect): the modal shows a spinner instead of its content
    // while the POST runs, so the input remounts empty; on a failed add the
    // picked id survives with no visible user, and the next confirm adds them.
    it('keeps the picked user visible after a failed add', async () => {
      const wrapper = await mountOpen()
      // handleAddMember does not catch the rethrown error; keep it out of the run.
      wrapper.vm.$.appContext.config.errorHandler = () => {}
      await pickAlice(wrapper)
      vi.mocked(axios.post).mockRejectedValueOnce(new Error('boom'))

      addModal(wrapper).vm.$emit('confirm')
      await settle()

      const input = wrapper.find('.base-modal-stub .user-search-container input').element as HTMLInputElement
      expect(input.value).toBe('Alice (alice@example.com)')
    })
  })

  describe('sorting members by name', () => {
    // Every row is a plain member, so no role grouping can mask the name order.
    // "zoe@example.com" has no name: the email stands in as the sort key.
    const roster = [
      { name: 'Participant 10', email: 'p10@example.com' },
      { name: 'Fabrice', email: 'fabrice@example.com' },
      { name: 'Participant 2', email: 'p2@example.com' },
      { name: null, email: 'zoe@example.com' },
      { name: 'élodie', email: 'elodie@example.com' },
      { name: 'Delphine', email: 'delphine@example.com' },
      { name: 'alice', email: 'alice@example.com' }
    ]

    async function mountRoster() {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          data: roster.map((m, i) => ({
            id: `gm-${i}`,
            user_id: `user-${i}`,
            role: 'member',
            user: { id: `user-${i}`, email: m.email, ...(m.name ? { display_name: m.name } : {}) }
          }))
        }
      })
      const wrapper = mountComponent()
      await flushPromises()
      return wrapper
    }

    // The label a row is identified by: its name, or its email when it has none.
    function rowLabels(wrapper: VueWrapper) {
      const labels = roster.map(m => m.name ?? m.email)
      return wrapper.findAll('[data-testid="member-row"]').map(row => {
        const text = row.text()
        // Longest match first so "Participant 10" is not read as "Participant 1…".
        return [...labels].sort((a, b) => b.length - a.length).find(l => text.includes(l))
      })
    }

    function sortButton(wrapper: VueWrapper) {
      return wrapper.find('[data-testid="members-sort"]')
    }

    const AZ = ['alice', 'Delphine', 'élodie', 'Fabrice', 'Participant 2', 'Participant 10', 'zoe@example.com']

    it('offers a labelled sort button', async () => {
      const wrapper = await mountRoster()

      const button = sortButton(wrapper)
      expect(button.exists()).toBe(true)
      expect(button.element.tagName).toBe('BUTTON')
      const label = button.attributes('aria-label') || button.attributes('title') || button.text()
      expect(label.trim().length).toBeGreaterThan(0)
    })

    it('lists members A to Z by default, case-, accent- and number-aware, email standing in for a missing name', async () => {
      const wrapper = await mountRoster()

      expect(rowLabels(wrapper)).toEqual(AZ)
    })

    it('reverses to Z to A on toggle, and back to A to Z on a second toggle', async () => {
      const wrapper = await mountRoster()

      await sortButton(wrapper).trigger('click')
      expect(rowLabels(wrapper)).toEqual([...AZ].reverse())

      await sortButton(wrapper).trigger('click')
      expect(rowLabels(wrapper)).toEqual(AZ)
    })

    it('sorts the search-filtered list without widening it', async () => {
      const wrapper = await mountRoster()

      await wrapper.find('input.search-input').setValue('Participant')
      expect(rowLabels(wrapper)).toEqual(['Participant 2', 'Participant 10'])

      await sortButton(wrapper).trigger('click')
      expect(rowLabels(wrapper)).toEqual(['Participant 10', 'Participant 2'])
    })

    it('keeps a selected member selected across a sort change', async () => {
      const wrapper = await mountRoster()

      const fabriceRow = () => wrapper.findAll('[data-testid="member-row"]').find(r => r.text().includes('Fabrice'))!
      await fabriceRow().find('input.member-checkbox').setValue(true)
      expect((fabriceRow().find('input.member-checkbox').element as HTMLInputElement).checked).toBe(true)

      await sortButton(wrapper).trigger('click')

      expect((fabriceRow().find('input.member-checkbox').element as HTMLInputElement).checked).toBe(true)
      const checked = wrapper.findAll('input.member-checkbox').filter(c => (c.element as HTMLInputElement).checked)
      expect(checked).toHaveLength(1)
    })
  })

})

// The class member list: trainers (owners, managers) sit apart from the
// participants and can never be ticked, so a bulk password reset only reaches
// participants; removing or regenerating asks first; the selection only holds
// rows the search leaves visible, and a sort change keeps it.
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

async function mountRoster(locale: 'en' | 'fr' = 'en') {
  vi.mocked(axios.get).mockResolvedValueOnce({ data: { data: structuredClone(roster) } })
  const wrapper = mountComponent({ canEditGroup: true, canNameOwner: true, isOwner: true }, locale)
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

    await wrapper.find('.select-all-checkbox input').setValue(true)
    expect(bulkBarText(wrapper)).toContain('3 selected')

    await wrapper.find('[data-testid="regenerate-passwords"]').trigger('click')
    await wrapper.find('[data-testid="regenerate-confirm"]').trigger('click')
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
    await wrapper.find('[data-testid="member-remove-cancel"]').trigger('click')
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

describe('GroupMembersManager password regeneration', () => {
  async function clickRegenerateOne(wrapper: VueWrapper, name: string) {
    await rowOf(wrapper, name).find('.member-actions .btn-icon').trigger('click')
    await rowOf(wrapper, name).find('[data-testid="member-regenerate-password"]').trigger('click')
  }

  it('offers a single regeneration on a participant row only', async () => {
    const wrapper = await mountRoster()

    for (const name of PARTICIPANTS) {
      await rowOf(wrapper, name).find('.member-actions .btn-icon').trigger('click')
      expect(rowOf(wrapper, name).find('[data-testid="member-regenerate-password"]').exists(), name).toBe(true)
    }
    for (const name of ['Co Owner', 'Manny Manager']) {
      const trigger = rowOf(wrapper, name).find('.member-actions .btn-icon')
      if (trigger.exists()) await trigger.trigger('click')
      expect(rowOf(wrapper, name).find('[data-testid="member-regenerate-password"]').exists(), name).toBe(false)
    }
  })

  it('asks before regenerating one participant\'s password, and sends nothing yet', async () => {
    const wrapper = await mountRoster()

    expect(wrapper.find('[data-testid="regenerate-confirm"]').exists()).toBe(false)
    await clickRegenerateOne(wrapper, 'Bob Participant')

    expect(wrapper.find('[data-testid="regenerate-confirm"]').exists()).toBe(true)
    expect(bulkImportService.regeneratePasswords).not.toHaveBeenCalled()
  })

  it('regenerates only that participant\'s password once confirmed, shows the credentials, and leaves the selection alone', async () => {
    vi.mocked(bulkImportService.regeneratePasswords).mockResolvedValueOnce({
      success: true,
      credentials: [{ user_id: 'p-bob', name: 'Bob Participant', email: 'bob@example.com', password: 'n3w-s3cret' }],
      errors: []
    } as any)
    const wrapper = await mountRoster()
    await tick(wrapper, 'Alice Participant')

    await clickRegenerateOne(wrapper, 'Bob Participant')
    await wrapper.find('[data-testid="regenerate-confirm"]').trigger('click')
    await flushPromises()

    expect(bulkImportService.regeneratePasswords).toHaveBeenCalledTimes(1)
    expect(bulkImportService.regeneratePasswords).toHaveBeenCalledWith('org-1', 'test-group-id', ['p-bob'])
    expect(wrapper.find('[data-testid="regenerate-confirm"]').exists()).toBe(false)
    const credentials = wrapper.find('.credentials-table')
    expect(credentials.exists()).toBe(true)
    expect(credentials.text()).toContain('bob@example.com')
    expect(credentials.text()).toContain('n3w-s3cret')
    expect(bulkBarText(wrapper)).toContain('1 selected')
  })

  it('sends nothing when the single regeneration is cancelled', async () => {
    const wrapper = await mountRoster()

    await clickRegenerateOne(wrapper, 'Bob Participant')
    await wrapper.find('[data-testid="regenerate-cancel"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="regenerate-confirm"]').exists()).toBe(false)
    expect(bulkImportService.regeneratePasswords).not.toHaveBeenCalled()
    expect(wrapper.find('.credentials-table').exists()).toBe(false)
  })

  it('bulk: asks first, then regenerates the selection and clears it once confirmed', async () => {
    const wrapper = await mountRoster()
    await tick(wrapper, 'Alice Participant')
    await tick(wrapper, 'Zoe Participant')

    await wrapper.find('[data-testid="regenerate-passwords"]').trigger('click')
    expect(wrapper.find('[data-testid="regenerate-confirm"]').exists()).toBe(true)
    expect(bulkImportService.regeneratePasswords).not.toHaveBeenCalled()

    await wrapper.find('[data-testid="regenerate-confirm"]').trigger('click')
    await flushPromises()

    expect(bulkImportService.regeneratePasswords).toHaveBeenCalledTimes(1)
    const [orgId, groupId, ids] = vi.mocked(bulkImportService.regeneratePasswords).mock.calls[0]
    expect([orgId, groupId]).toEqual(['org-1', 'test-group-id'])
    expect([...ids].sort()).toEqual(['p-alice', 'p-zoe'])
    // The bar keeps its slot: back to the hint, count at 0, action disabled.
    expect(bulkBarText(wrapper)).toContain('0 selected')
    expect(wrapper.find('[data-testid="regenerate-passwords"]').attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('input.member-checkbox').some(c => (c.element as HTMLInputElement).checked)).toBe(false)
  })

  it('bulk: cancelling sends nothing and keeps the selection', async () => {
    const wrapper = await mountRoster()
    await tick(wrapper, 'Alice Participant')
    await tick(wrapper, 'Zoe Participant')

    await wrapper.find('[data-testid="regenerate-passwords"]').trigger('click')
    await wrapper.find('[data-testid="regenerate-cancel"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="regenerate-confirm"]').exists()).toBe(false)
    expect(bulkImportService.regeneratePasswords).not.toHaveBeenCalled()
    expect(bulkBarText(wrapper)).toContain('2 selected')
  })
})

describe('GroupMembersManager promoting a ticked participant', () => {
  it('drops a participant promoted to manager from the selection and from a later bulk reset', async () => {
    const wrapper = await mountRoster()
    await tick(wrapper, 'Alice Participant')
    expect(bulkBarText(wrapper)).toContain('1 selected')

    await rowOf(wrapper, 'Alice Participant').find('select.role-select').setValue('manager')
    await flushPromises()

    // She now sits among the trainers, with no checkbox.
    const html = wrapper.html()
    const aliceAt = html.indexOf('Alice Participant')
    expect(aliceAt).toBeGreaterThan(html.indexOf('data-testid="members-group-trainers"'))
    expect(aliceAt).toBeLessThan(html.indexOf('data-testid="members-group-participants"'))
    expect(rowOf(wrapper, 'Alice Participant').find('input.member-checkbox').exists()).toBe(false)

    // And out of the selection.
    expect(bulkBarText(wrapper)).toContain('0 selected')

    await tick(wrapper, 'Bob Participant')
    await wrapper.find('[data-testid="regenerate-passwords"]').trigger('click')
    await wrapper.find('[data-testid="regenerate-confirm"]').trigger('click')
    await flushPromises()

    expect(bulkImportService.regeneratePasswords).toHaveBeenCalledTimes(1)
    expect(vi.mocked(bulkImportService.regeneratePasswords).mock.calls[0][2]).toEqual(['p-bob'])
  })
})

describe('GroupMembersManager bulk slot stability', () => {
  // The bulk bar is a reserved slot: removing it when the search hides every
  // participant would shift the list up.
  it('keeps the bulk slot when the search matches only trainers', async () => {
    const wrapper = await mountRoster()
    expect(wrapper.find('[data-testid="members-bulk-bar"]').exists()).toBe(true)

    await wrapper.find('input.search-input').setValue('Creator')
    await flushPromises()

    expect(wrapper.findAll('[data-testid="member-row"]').map(r => r.text()).join()).toContain('Creator')
    expect(wrapper.find('[data-testid="members-bulk-bar"]').exists()).toBe(true)
  })

  it('keeps the bulk slot when the search matches nobody', async () => {
    const wrapper = await mountRoster()

    await wrapper.find('input.search-input').setValue('no-such-member')
    await flushPromises()

    expect(wrapper.find('[data-testid="member-row"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="members-bulk-bar"]').exists()).toBe(true)
  })

  it('shows no bulk slot for a class without participants', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: structuredClone(roster).filter(m => m.role !== 'member') }
    })
    const wrapper = mountComponent({ canEditGroup: true, canNameOwner: true, isOwner: true })
    await flushPromises()

    expect(wrapper.find('[data-testid="members-bulk-bar"]').exists()).toBe(false)
  })
})

describe('GroupMembersManager regeneration wording', () => {
  async function openSingle(locale: 'en' | 'fr') {
    const wrapper = await mountRoster(locale)
    await rowOf(wrapper, 'Bob Participant').find('.member-actions .btn-icon').trigger('click')
    await rowOf(wrapper, 'Bob Participant').find('[data-testid="member-regenerate-password"]').trigger('click')
    return wrapper.find('.base-modal-stub')
  }

  async function openBulk(locale: 'en' | 'fr') {
    const wrapper = await mountRoster(locale)
    await tick(wrapper, 'Alice Participant')
    await tick(wrapper, 'Zoe Participant')
    await wrapper.find('[data-testid="regenerate-passwords"]').trigger('click')
    return { wrapper, modal: wrapper.find('.base-modal-stub') }
  }

  it('FR: one participant gets a singular title and text naming them', async () => {
    const modal = await openSingle('fr')

    expect(modal.find('[data-testid="regenerate-confirm"]').exists()).toBe(true)
    expect(modal.find('.base-modal-title').text()).not.toContain('mots de passe')
    expect(modal.text()).toContain('Bob Participant')
    expect(modal.text()).toContain('mot de passe')
    expect(modal.text()).not.toContain('mots de passe')
    expect(modal.text()).not.toContain('(s)')
  })

  it('EN: one participant gets a singular title and text naming them', async () => {
    const modal = await openSingle('en')

    expect(modal.find('[data-testid="regenerate-confirm"]').exists()).toBe(true)
    expect(modal.find('.base-modal-title').text().toLowerCase()).not.toContain('passwords')
    expect(modal.text()).toContain('Bob Participant')
    expect(modal.text().toLowerCase()).toContain('password')
    expect(modal.text().toLowerCase()).not.toContain('passwords')
    expect(modal.text()).not.toContain('(s)')
  })

  it('FR: the bulk confirmation is plural, with the count and no « (s) »', async () => {
    const { wrapper, modal } = await openBulk('fr')

    expect(modal.text()).toContain('2')
    expect(modal.text()).toContain('mots de passe')
    expect(modal.text()).not.toContain('(s)')
    expect(bulkBarText(wrapper)).toContain('2')
    expect(bulkBarText(wrapper)).not.toContain('(s)')
  })

  it('EN: the bulk confirmation is plural, with the count and no "(s)"', async () => {
    const { wrapper, modal } = await openBulk('en')

    expect(modal.text()).toContain('2')
    expect(modal.text().toLowerCase()).toContain('passwords')
    expect(modal.text()).not.toContain('(s)')
    expect(bulkBarText(wrapper)).toContain('2 selected')
    expect(bulkBarText(wrapper)).not.toContain('(s)')
  })
})

describe('GroupMembersManager large class pagination', () => {
  // A 47-participant class used to show only the first 20 members the API
  // returned. Every member is loaded; search and sort apply to the whole list;
  // participants are then shown 25 per page, trainers always pinned on top.
  const pad = (n: number) => String(n).padStart(2, '0')
  const PARTICIPANT_COUNT = 47
  const bigRoster = [
    { id: 'gm-owner', user_id: 'owner-1', role: 'owner', user: { id: 'owner-1', email: 'owner@example.com', display_name: 'Creator' } },
    // Shuffled so the order shown comes from the sort, not from the API.
    ...Array.from({ length: PARTICIPANT_COUNT }, (_, i) => (i * 13) % PARTICIPANT_COUNT + 1).map(n => ({
      id: `gm-p${pad(n)}`,
      user_id: `p-${pad(n)}`,
      role: 'member',
      user: { id: `p-${pad(n)}`, email: `p${pad(n)}@example.com`, display_name: `Participant ${pad(n)}` }
    })),
    { id: 'gm-mgr', user_id: 'mgr-1', role: 'manager', user: { id: 'mgr-1', email: 'mgr@example.com', display_name: 'Manny Manager' } }
  ]

  async function mountBigClass() {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { data: structuredClone(bigRoster) } })
    const wrapper = mountComponent({ canEditGroup: true, canNameOwner: true, isOwner: true })
    await flushPromises()
    return wrapper
  }

  function names(wrapper: VueWrapper, group: 'trainers' | 'participants') {
    return wrapper
      .find(`[data-testid="members-group-${group}"]`)
      .findAll('[data-testid="member-row"] .ocf-member-row__name')
      .map(n => n.text())
  }

  const participantNames = (wrapper: VueWrapper) => names(wrapper, 'participants')
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => `Participant ${pad(from + i)}`)

  function participantsCount(wrapper: VueWrapper) {
    return wrapper.find('[data-testid="members-group-participants"] .ocf-members-group__count').text()
  }

  async function nextPage(wrapper: VueWrapper) {
    await wrapper.find('[data-testid="members-page-next"]').trigger('click')
    await flushPromises()
  }

  it('shows the first 25 participants, A to Z, under the pinned trainers', async () => {
    const wrapper = await mountBigClass()

    expect(names(wrapper, 'trainers').sort()).toEqual(['Creator', 'Manny Manager'])
    expect(participantNames(wrapper)).toEqual(range(1, 25))
    expect(wrapper.findAll('[data-testid="member-row"]')).toHaveLength(27)
  })

  it('counts every participant in the group heading, not just the page', async () => {
    const wrapper = await mountBigClass()

    expect(participantsCount(wrapper)).toBe(String(PARTICIPANT_COUNT))
  })

  it('pages to the remaining 22 participants, keeping the trainers shown', async () => {
    const wrapper = await mountBigClass()
    expect(wrapper.find('[data-testid="members-page-indicator"]').text()).toContain('1 / 2')
    expect(wrapper.find('[data-testid="members-page-prev"]').exists()).toBe(true)

    await nextPage(wrapper)

    expect(participantNames(wrapper)).toEqual(range(26, 47))
    expect(names(wrapper, 'trainers').sort()).toEqual(['Creator', 'Manny Manager'])
    expect(wrapper.find('[data-testid="members-page-indicator"]').text()).toContain('2 / 2')
    expect(participantsCount(wrapper)).toBe(String(PARTICIPANT_COUNT))

    await wrapper.find('[data-testid="members-page-prev"]').trigger('click')
    await flushPromises()
    expect(participantNames(wrapper)).toEqual(range(1, 25))
  })

  it('sorts the whole class, not just the page, and returns to page 1 on a sort change', async () => {
    const wrapper = await mountBigClass()
    await nextPage(wrapper)

    await wrapper.find('[data-testid="members-sort"]').trigger('click')
    await flushPromises()

    expect(participantNames(wrapper)).toEqual(range(23, 47).reverse())
    expect(wrapper.find('[data-testid="members-page-indicator"]').text()).toContain('1 / 2')
  })

  it('searches the whole class and returns to page 1 on a new search', async () => {
    const wrapper = await mountBigClass()
    await nextPage(wrapper)

    await wrapper.find('input.search-input').setValue('Participant 0')
    await flushPromises()

    expect(participantNames(wrapper)).toEqual(range(1, 9))
    expect(participantsCount(wrapper)).toBe('9')
    // A single page needs no pager.
    expect(wrapper.find('[data-testid="members-page-next"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="members-page-indicator"]').exists()).toBe(false)
  })

  it('finds a participant who is not on the first page', async () => {
    const wrapper = await mountBigClass()

    await wrapper.find('input.search-input').setValue('Participant 4')
    await flushPromises()

    expect(participantNames(wrapper)).toEqual(range(40, 47))
  })

  it('select-all ticks only the 25 participants on the page', async () => {
    const wrapper = await mountBigClass()

    await wrapper.find('.select-all-checkbox input').setValue(true)

    expect(bulkBarText(wrapper)).toContain('25 selected')
  })

  it('drops the selection when the page changes, so it only holds visible participants', async () => {
    const wrapper = await mountBigClass()
    await wrapper.find('.select-all-checkbox input').setValue(true)
    expect(bulkBarText(wrapper)).toContain('25 selected')

    await nextPage(wrapper)

    expect(bulkBarText(wrapper)).toContain('0 selected')
    expect(wrapper.findAll('input.member-checkbox').some(c => (c.element as HTMLInputElement).checked)).toBe(false)
    expect((wrapper.find('.select-all-checkbox input').element as HTMLInputElement).checked).toBe(false)
  })

  it('shows no pager for a class that fits on one page', async () => {
    const wrapper = await mountRoster()

    expect(wrapper.find('[data-testid="members-page-prev"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="members-page-next"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="members-page-indicator"]').exists()).toBe(false)
  })
})

describe('GroupMembersManager credentials CSV (#392)', () => {
  // A participant's name or email starting with = + - @ would run as a formula
  // when the trainer opens the file in a spreadsheet. The password column is
  // left as is: prefixing it would hand the participant a wrong password.
  let exported: Blob[] = []

  beforeEach(() => {
    exported = []
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((blob: Blob) => { exported.push(blob); return 'blob:mock' }),
      revokeObjectURL: vi.fn()
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  async function downloadCredentials(credentials: Array<{ name: string, email: string, password: string }>) {
    vi.mocked(bulkImportService.regeneratePasswords).mockResolvedValueOnce({
      success: true,
      credentials: credentials.map((c, i) => ({ user_id: `u-${i}`, ...c })),
      errors: []
    } as any)
    const wrapper = await mountRoster()
    await tick(wrapper, 'Bob Participant')
    await wrapper.find('[data-testid="regenerate-passwords"]').trigger('click')
    await wrapper.find('[data-testid="regenerate-confirm"]').trigger('click')
    await flushPromises()
    const button = wrapper.findAll('button').find(b => b.text().includes('Download CSV'))
    expect(button, 'download button').toBeDefined()
    await button!.trigger('click')
    expect(exported).toHaveLength(1)
    return (await exported[0].text()).split('\n')
  }

  it('neutralises a name and an email that would run as a formula', async () => {
    const name = '=HYPERLINK("http://x")'
    const email = '+33@example.com'
    const lines = await downloadCredentials([{ name, email, password: 'plain' }])

    expect(lines[1]).toBe(`${sanitizeCSVField(name)},${sanitizeCSVField(email)},"plain"`)
  })

  it('keeps a password starting with - @ or = byte for byte, quotes escaped only', async () => {
    const lines = await downloadCredentials([
      { name: 'A', email: 'a@example.com', password: '-a"b' },
      { name: 'B', email: 'b@example.com', password: '@pass' },
      { name: 'C', email: 'c@example.com', password: '=pass+1' }
    ])

    expect(lines[1].endsWith(',"-a""b"')).toBe(true)
    expect(lines[2].endsWith(',"@pass"')).toBe(true)
    expect(lines[3].endsWith(',"=pass+1"')).toBe(true)
  })
})

describe('GroupMembersManager joined date', () => {
  it('shows the day a participant joined on the saved time zone\'s calendar', async () => {
    // 11:30 UTC is already 16/03 in Auckland (UTC+13).
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { data: [{ id: 'gm-1', user_id: 'p-1', role: 'member', joined_at: '2026-03-15T11:30:00Z', user: { id: 'p-1', email: 'p@example.com', display_name: 'Pat Participant' } }] }
    })
    const wrapper = mountComponent({ canEditGroup: true, canNameOwner: true, isOwner: true })
    getActivePinia()!.state.value.UserSettings = { settings: { timezone: 'Pacific/Auckland' } }
    await flushPromises()

    expect(rowOf(wrapper, 'Pat Participant').find('td[title]').attributes('title')).toContain('16/03/2026')
  })
})
