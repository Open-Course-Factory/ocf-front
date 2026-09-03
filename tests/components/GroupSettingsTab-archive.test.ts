/**
 * GroupSettingsTab — the archive / restore verb of a class (ocf-front#330).
 *
 * One slot next to Edit carries either verb, so the header never reflows; the
 * status badge and the verb read the same `archived_at` the backend stamps.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const unarchiveEntity = vi.fn()
const toastError = vi.fn()

vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({
    unarchiveEntity: (...args: any[]) => unarchiveEntity(...args),
    updateEntity: vi.fn(),
    deleteEntity: vi.fn()
  })
}))

vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({ error: (...args: any[]) => toastError(...args), success: vi.fn() })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

import GroupSettingsTab from '../../src/components/Groups/GroupSettingsTab.vue'

const openClass = {
  id: 'class-1',
  name: 'devops-2026',
  display_name: 'DevOps 2026',
  owner_user_id: 'owner-1',
  organization_id: 'org-1',
  max_members: 30,
  member_count: 12,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z'
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

function mountTab(group: Record<string, any> = openClass) {
  return mount(GroupSettingsTab, {
    props: {
      group,
      ownerUser: null,
      groupOrganization: null,
      memberCount: 12,
      canEditGroup: true,
      canDeleteGroup: true
    },
    global: {
      plugins: [createTestI18n()],
      stubs: {
        RouterLink: { template: '<a><slot /></a>', props: ['to'] },
        EntityModal: { template: '<div class="entity-modal-stub" />', props: ['visible', 'entity', 'entityStore', 'entityName'] },
        BaseModal: { template: '<div class="base-modal-stub" v-if="visible"><slot /></div>', props: ['visible', 'title', 'size', 'showDefaultFooter', 'confirmText', 'cancelText'] },
        ClassArchiveDialog: {
          name: 'ClassArchiveDialog',
          template: '<div class="archive-dialog-stub" :data-visible="visible" />',
          props: ['visible', 'group'],
          emits: ['archived', 'close']
        }
      }
    }
  })
}

describe('GroupSettingsTab archive verb', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    unarchiveEntity.mockResolvedValue({ ...openClass })
  })

  it('offers to archive an open class and shows it active', () => {
    const wrapper = mountTab()

    expect(wrapper.find('[data-test="archive-class"]').text()).toBe('Archive class')
    expect(wrapper.find('[data-test="restore-class"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="class-status"]').text()).toBe('Active')
  })

  it('opens the archive dialog for this class', async () => {
    const wrapper = mountTab()
    expect(wrapper.find('.archive-dialog-stub').attributes('data-visible')).toBe('false')

    await wrapper.find('[data-test="archive-class"]').trigger('click')

    expect(wrapper.find('.archive-dialog-stub').attributes('data-visible')).toBe('true')
    expect(wrapper.findComponent({ name: 'ClassArchiveDialog' }).props('group')).toEqual(openClass)
  })

  it('asks the page to reload once the dialog archived the class', async () => {
    const wrapper = mountTab()

    wrapper.findComponent({ name: 'ClassArchiveDialog' }).vm.$emit('archived')

    expect(wrapper.emitted('group-updated')).toHaveLength(1)
  })

  it('offers to restore an archived class in the same slot and shows it archived', () => {
    const wrapper = mountTab({ ...openClass, archived_at: '2026-06-30T00:00:00Z', is_active: false })

    expect(wrapper.find('[data-test="restore-class"]').text()).toBe('Restore class')
    expect(wrapper.find('[data-test="archive-class"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="class-status"]').text()).toBe('Archived')
  })

  it('restores through the store action and reloads', async () => {
    const wrapper = mountTab({ ...openClass, archived_at: '2026-06-30T00:00:00Z', is_active: false })

    await wrapper.find('[data-test="restore-class"]').trigger('click')
    await flushPromises()

    expect(unarchiveEntity).toHaveBeenCalledWith('/class-groups', 'class-1')
    expect(wrapper.emitted('group-updated')).toHaveLength(1)
  })

  it('surfaces the backend reason when restoring is refused', async () => {
    unarchiveEntity.mockRejectedValue({ response: { data: { error_message: 'organization is archived' } } })
    const wrapper = mountTab({ ...openClass, archived_at: '2026-06-30T00:00:00Z', is_active: false })

    await wrapper.find('[data-test="restore-class"]').trigger('click')
    await flushPromises()

    expect(toastError).toHaveBeenCalledWith('organization is archived')
    expect(wrapper.emitted('group-updated')).toBeUndefined()
  })
})
