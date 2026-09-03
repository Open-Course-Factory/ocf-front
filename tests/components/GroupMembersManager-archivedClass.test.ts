/**
 * An archived class opens read-only for its teacher (ocf-core#491): the roster
 * stays readable, and "Add member" stays where it is — disabled, with the
 * reason on hover — rather than vanishing.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

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
  bulkImportService: { regeneratePasswords: vi.fn() }
}))

vi.mock('../../src/utils/formatters', () => ({
  formatDate: (date: string) => date
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userId: 'owner-1', isAdmin: false, isLoggedIn: true })
}))

import GroupMembersManager from '../../src/components/Groups/GroupMembersManager.vue'

const openClass = {
  id: 'class-1',
  name: 'devops-2026',
  display_name: 'DevOps 2026',
  owner_user_id: 'owner-1',
  organization_id: 'org-1',
  is_active: true,
  max_members: 30,
  member_count: 1,
  is_full: false
}

function mountManager(group: Record<string, any>) {
  setActivePinia(createPinia())
  return mount(GroupMembersManager, {
    props: {
      groupId: group.id,
      group,
      canEditGroup: true,
      isOwner: true,
      isManager: false,
      isPlatformAdmin: false,
      subgroups: []
    },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        BaseModal: { template: '<div class="base-modal-stub"><slot /></div>', props: ['visible', 'title', 'size', 'isLoading', 'showDefaultFooter', 'confirmText', 'cancelText'] },
        AdminBadge: { template: '<span />', props: ['iconOnly', 'tooltip'] },
        RouterLink: { template: '<a><slot /></a>', props: ['to'] }
      }
    }
  })
}

describe('GroupMembersManager on an archived class', () => {
  it('keeps Add member enabled on an open class', () => {
    const wrapper = mountManager(openClass)
    const button = wrapper.find('[data-test="add-member"]')

    expect(button.exists()).toBe(true)
    expect((button.element as HTMLButtonElement).disabled).toBe(false)
    expect(wrapper.find('[data-test="add-member-slot"]').attributes('title')).toBeUndefined()
  })

  it('disables Add member and explains why, without removing it', () => {
    const wrapper = mountManager({ ...openClass, archived_at: '2026-06-30T00:00:00Z', is_active: false })
    const button = wrapper.find('[data-test="add-member"]')

    expect(button.exists()).toBe(true)
    expect((button.element as HTMLButtonElement).disabled).toBe(true)
    expect(wrapper.find('[data-test="add-member-slot"]').attributes('title'))
      .toBe('This class is archived: it takes no new member. Restore it from its settings first.')
  })
})
