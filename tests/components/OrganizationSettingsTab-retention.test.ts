/**
 * Retention delay of an organization (ocf-core#492): how long an offboarded
 * member is kept before erasure. Visible to every manager, editable by the
 * owner only — the backend refuses a manager's PATCH, the UI merely mirrors it.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'

const updateRetentionDays = vi.fn()
const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    updateRetentionDays: (...args: any[]) => updateRetentionDays(...args),
    convertToTeamOrganization: vi.fn(),
    deleteOrganization: vi.fn()
  })
}))

vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({ success: (...a: any[]) => toastSuccess(...a), error: (...a: any[]) => toastError(...a) })
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({ isAdmin: ref(false) })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

import OrganizationSettingsTab from '../../src/components/Organizations/OrganizationSettingsTab.vue'

const organization = {
  id: 'org-1',
  name: 'esitech',
  display_name: 'ESITECH',
  owner_user_id: 'owner-1',
  organization_type: 'team',
  is_personal: false,
  max_groups: 20,
  max_members: 100,
  is_active: true,
  member_count: 3,
  retention_days: null
}

function mountTab(props: Record<string, any> = {}) {
  return mount(OrganizationSettingsTab, {
    props: { organization, organizationId: 'org-1', isOwner: true, canDelete: true, ...props },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        BaseModal: { template: '<div v-if="visible"><slot /></div>', props: ['visible'] },
        AdminBadge: { template: '<span />', props: ['iconOnly'] }
      }
    }
  })
}

describe('OrganizationSettingsTab retention delay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateRetentionDays.mockResolvedValue({ ...organization, retention_days: 30 })
  })

  it('shows the platform default as a placeholder when the organization has none', () => {
    const input = mountTab().find('[data-test="retention-days"]')

    expect((input.element as HTMLInputElement).value).toBe('')
    expect(input.attributes('placeholder')).toBe('Platform default (365 days)')
  })

  it('shows the organization delay when it has one', () => {
    const input = mountTab({ organization: { ...organization, retention_days: 90 } }).find('[data-test="retention-days"]')
    expect((input.element as HTMLInputElement).value).toBe('90')
  })

  it('is read-only for a manager, and says so', () => {
    const wrapper = mountTab({ isOwner: false, canDelete: false })

    expect((wrapper.find('[data-test="retention-days"]').element as HTMLInputElement).disabled).toBe(true)
    expect(wrapper.find('[data-test="retention-save"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="retention-owner-only"]').text()).toBe('Only organization owners can change the retention delay.')
  })

  it('lets the owner save a delay', async () => {
    const wrapper = mountTab()

    await wrapper.find('[data-test="retention-days"]').setValue('30')
    await wrapper.find('[data-test="retention-save"]').trigger('click')
    await flushPromises()

    expect(updateRetentionDays).toHaveBeenCalledWith('org-1', 30)
    expect(wrapper.emitted('updated')).toHaveLength(1)
    expect(toastSuccess).toHaveBeenCalled()
  })

  it('clearing the field restores the platform default', async () => {
    const wrapper = mountTab({ organization: { ...organization, retention_days: 90 } })

    await wrapper.find('[data-test="retention-days"]').setValue('')
    await wrapper.find('[data-test="retention-save"]').trigger('click')
    await flushPromises()

    expect(updateRetentionDays).toHaveBeenCalledWith('org-1', null)
  })

  it('refuses to save a delay under one day', async () => {
    const wrapper = mountTab()

    await wrapper.find('[data-test="retention-days"]').setValue('0')

    expect((wrapper.find('[data-test="retention-save"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('surfaces the backend refusal verbatim', async () => {
    updateRetentionDays.mockRejectedValue({ response: { data: { error_message: 'only the owner may change retention_days' } } })
    const wrapper = mountTab()

    await wrapper.find('[data-test="retention-days"]').setValue('30')
    await wrapper.find('[data-test="retention-save"]').trigger('click')
    await flushPromises()

    expect(toastError).toHaveBeenCalledWith('only the owner may change retention_days')
    expect(wrapper.emitted('updated')).toBeUndefined()
  })
})
