import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'

// Mock axios before importing the component. The component imports the default
// axios export directly, so the mocked default is what it calls.
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}))

// userService is used by the add-member search; keep it inert.
vi.mock('../../src/services/domain/user', () => ({
  userService: {
    searchUsers: vi.fn().mockResolvedValue([])
  }
}))

// currentUser store backs useAdminViewMode; a non-admin, logged-in user.
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    userId: 'current-user-id',
    userRoles: [],
    isLoggedIn: true
  })
}))

import OrganizationMembersManager from '../../src/components/Organizations/OrganizationMembersManager.vue'
import { userService } from '../../src/services/domain/user'

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

const testMember = {
  id: 'member-42',
  user_id: 'user-9',
  role: 'member',
  joined_at: '2026-01-01T00:00:00Z',
  user: { id: 'user-9', email: 'jane@example.com', display_name: 'Jane' }
}

function mountComponent(propsOverrides: Record<string, unknown> = {}) {
  const i18n = createTestI18n()
  setActivePinia(createPinia())

  return mount(OrganizationMembersManager, {
    props: {
      organizationId: 'org-77',
      canManage: true,
      isOwner: false,
      ...propsOverrides
    },
    global: {
      plugins: [i18n],
      stubs: {
        BaseModal: {
          name: 'BaseModal',
          template: '<div class="base-modal-stub" v-if="visible"><slot /><slot name="footer" /></div>',
          props: ['visible', 'title', 'titleIcon', 'size', 'showDefaultFooter',
                  'confirmText', 'confirmIcon', 'cancelText', 'isLoading', 'loadingText'],
          emits: ['close', 'confirm']
        },
        AdminBadge: {
          name: 'AdminBadge',
          template: '<span class="admin-badge-stub" />',
          props: ['iconOnly', 'tooltip']
        }
      }
    }
  })
}

describe('OrganizationMembersManager backend endpoint contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // loadMembers assigns response.data directly to members.
    vi.mocked(axios.get).mockResolvedValue({ data: [{ ...testMember }] })
    vi.mocked(axios.patch).mockResolvedValue({ data: {} })
    vi.mocked(axios.delete).mockResolvedValue({ data: {} })
  })

  it('changes a member role via PATCH /organization-members/:id with the new role', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    const roleSelect = wrapper.find('select.role-select')
    expect(roleSelect.exists()).toBe(true)

    await roleSelect.setValue('manager')
    await flushPromises()

    expect(axios.patch).toHaveBeenCalledWith(
      '/organization-members/member-42',
      { role: 'manager' }
    )
  })

  it('removes a member via DELETE /organization-members/:id', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('button.btn-danger').trigger('click')
    await flushPromises()

    const removeModal = wrapper.findAllComponents({ name: 'BaseModal' })[0]
    removeModal.vm.$emit('confirm')
    await flushPromises()

    expect(axios.delete).toHaveBeenCalledWith('/organization-members/member-42')
  })

  it('reloads the member list after a successful removal', async () => {
    const wrapper = mountComponent()
    await flushPromises()
    expect(axios.get).toHaveBeenCalledTimes(1)

    await wrapper.find('button.btn-danger').trigger('click')
    await flushPromises()

    const removeModal = wrapper.findAllComponents({ name: 'BaseModal' })[0]
    removeModal.vm.$emit('confirm')
    await flushPromises()

    expect(axios.get).toHaveBeenCalledTimes(2)
  })
})

describe('OrganizationMembersManager add member: a cancelled pick is never added', () => {
  const alice = { id: 'alice-id', name: 'alice', display_name: 'Alice', email: 'alice@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.mocked(axios.get).mockResolvedValue({ data: [{ ...testMember }] })
    vi.mocked(userService.searchUsers).mockImplementation(async (q: string) => (q.startsWith('al') ? [alice] : []))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.mocked(userService.searchUsers).mockReset().mockResolvedValue([])
  })

  async function type(wrapper: ReturnType<typeof mountComponent>, query: string) {
    const input = wrapper.find('.base-modal-stub .user-search-container input')
    await input.trigger('focus')
    await input.setValue(query)
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()
  }

  const openAdd = (wrapper: ReturnType<typeof mountComponent>) =>
    wrapper.findAll('button').find(b => b.text() === 'Add Member')!.trigger('click')

  it('does not add a user picked before the dialog was cancelled', async () => {
    const wrapper = mountComponent()
    await flushPromises()
    await openAdd(wrapper)
    await type(wrapper, 'ali')
    await wrapper.find('.base-modal-stub .search-result').trigger('click')
    wrapper.findAllComponents({ name: 'BaseModal' }).find(m => m.props('visible'))!.vm.$emit('close')
    await flushPromises()

    await openAdd(wrapper)
    const confirm = () => wrapper.find('.base-modal-stub button.btn-primary')
    expect(confirm().attributes('disabled')).toBeDefined()
    await type(wrapper, 'bob')
    expect(confirm().attributes('disabled')).toBeDefined()
    await confirm().trigger('click')
    await flushPromises()

    expect(vi.mocked(axios.post).mock.calls.filter(([url]) => url === '/organization-members')).toEqual([])
  })
})
