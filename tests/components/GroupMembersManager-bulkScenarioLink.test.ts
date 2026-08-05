/**
 * The members toolbar's bulk CTA must lead somewhere that works (issue #302).
 *
 * It used to link to `/terminal-creation?mode=bulk&groupId=<id>`, but that page
 * never reads `route.query` — the group was silently dropped and the teacher
 * landed on the ordinary single-session form. The working way to give every
 * member an environment is the group's Scenarios tab, where an assignment can
 * be bulk-started, so the CTA points there.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: [] } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

vi.mock('../../src/services/core/error', () => ({
  handleStoreError: (_err: any, fallbackKey: string) => fallbackKey,
}))

vi.mock('../../src/services/domain/user', () => ({
  userService: { searchUsers: vi.fn().mockResolvedValue([]) },
}))

vi.mock('../../src/services/domain/bulkImport', () => ({
  bulkImportService: {
    regeneratePasswords: vi.fn().mockResolvedValue({ success: true, credentials: [], errors: [] }),
  },
}))

vi.mock('../../src/utils/formatters', () => ({
  formatDate: (date: string) => date,
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({
    userId: 'current-user-id',
    isAdmin: false,
    isLoggedIn: true,
  }),
}))

import GroupMembersManager from '../../src/components/Groups/GroupMembersManager.vue'

const group = {
  id: 'test-group-id',
  name: 'test-group',
  display_name: 'Test Group',
  owner_user_id: 'current-user-id',
  organization_id: 'org-1',
  is_active: true,
  max_members: 50,
  member_count: 1,
  is_full: false,
}

function mountManager() {
  setActivePinia(createPinia())

  return mount(GroupMembersManager, {
    props: {
      groupId: 'test-group-id',
      group,
      canEditGroup: true,
      isOwner: true,
      isManager: false,
      isPlatformAdmin: false,
      subgroups: [],
    },
    global: {
      plugins: [
        createI18n({
          legacy: false,
          locale: 'en',
          fallbackLocale: 'en',
          messages: { en: {}, fr: {} },
          missingWarn: false,
          fallbackWarn: false,
        }),
      ],
      stubs: {
        BaseModal: {
          template: '<div class="base-modal-stub"><slot /></div>',
          props: ['visible', 'title', 'size', 'isLoading', 'showDefaultFooter', 'confirmText', 'cancelText'],
        },
        AdminBadge: { template: '<span class="admin-badge-stub" />', props: ['iconOnly', 'tooltip'] },
        RouterLink: {
          name: 'RouterLink',
          template: '<a class="router-link-stub"><slot /></a>',
          props: ['to'],
        },
      },
    },
  })
}

async function mountWithOneMember() {
  const wrapper = mountManager()
  // Let the component's own members load settle first — seeding the roster while
  // that request is still in flight means the (empty) response overwrites it.
  await flushPromises()

  // `members` is exposed as a ref; the component proxy unwraps it on access.
  wrapper.vm.members = [
    {
      id: 'member-1',
      user_id: 'learner-1',
      role: 'member',
      user: { id: 'learner-1', email: 'learner@example.com', display_name: 'Learner One' },
    },
  ]
  await nextTick()

  return wrapper
}

function bulkCta(wrapper: Awaited<ReturnType<typeof mountWithOneMember>>) {
  return wrapper
    .findAllComponents({ name: 'RouterLink' })
    .find((link) => link.attributes('data-test') === 'bulk-scenario-link')
}

describe('GroupMembersManager — bulk environment CTA', () => {
  it('sends the teacher to the group Scenarios tab', async () => {
    const wrapper = await mountWithOneMember()
    const cta = bulkCta(wrapper)

    expect(cta).toBeDefined()
    expect(cta!.props('to')).toEqual({
      name: 'ClassScenarios',
      params: { id: 'test-group-id' },
    })
  })

  it('no longer links to the terminal-creation page, which drops the group', async () => {
    const wrapper = await mountWithOneMember()

    const targets = wrapper
      .findAllComponents({ name: 'RouterLink' })
      .map((link) => JSON.stringify(link.props('to')))

    expect(targets.some((target) => target.includes('terminal-creation'))).toBe(false)
  })

  it('hides the CTA while the group has no members to start anything for', async () => {
    const wrapper = mountManager()
    await nextTick()

    expect(bulkCta(wrapper)).toBeUndefined()
  })
})
