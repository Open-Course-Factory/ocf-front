/**
 * AI assistant config section of OrganizationSettingsTab: lets an org manager
 * configure an OpenAI-compatible endpoint used by the scenario editor's
 * "Create/Improve with AI" flow instead of the manual copy/paste prompt.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'

const updateRetentionDays = vi.fn()
const toastSuccess = vi.fn()
const toastError = vi.fn()

const getMock = vi.fn()
const putMock = vi.fn()
vi.mock('axios', () => ({
  default: {
    get: (...args: any[]) => getMock(...args),
    put: (...args: any[]) => putMock(...args),
    post: vi.fn(),
    delete: vi.fn()
  }
}))

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

describe('OrganizationSettingsTab AI assistant config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMock.mockResolvedValue({ data: { enabled: false, endpoint: '', model: '', has_api_key: false } })
  })

  it('loads the existing config on mount', async () => {
    getMock.mockResolvedValue({
      data: { enabled: true, endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', has_api_key: true }
    })

    const wrapper = mountTab()
    await flushPromises()

    expect(getMock).toHaveBeenCalledWith('/organizations/org-1/ai-config')
    expect((wrapper.find('[data-test="ai-config-enabled"]').element as HTMLInputElement).checked).toBe(true)
    expect((wrapper.find('[data-test="ai-config-endpoint"]').element as HTMLInputElement).value).toBe('https://api.openai.com/v1/chat/completions')
    expect((wrapper.find('[data-test="ai-config-model"]').element as HTMLInputElement).value).toBe('gpt-4o-mini')
    expect((wrapper.find('[data-test="ai-config-api-key"]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('[data-test="ai-config-api-key"]').attributes('placeholder')).toContain('keep')
  })

  it('saves the config without sending an api_key when the field is left blank', async () => {
    putMock.mockResolvedValue({ data: { enabled: true, endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', has_api_key: true } })

    const wrapper = mountTab()
    await flushPromises()

    await wrapper.find('[data-test="ai-config-enabled"]').setValue(true)
    await wrapper.find('[data-test="ai-config-endpoint"]').setValue('https://api.openai.com/v1/chat/completions')
    await wrapper.find('[data-test="ai-config-model"]').setValue('gpt-4o-mini')
    await wrapper.find('[data-test="ai-config-save"]').trigger('click')
    await flushPromises()

    expect(putMock).toHaveBeenCalledWith('/organizations/org-1/ai-config', {
      enabled: true,
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini'
    })
    expect(toastSuccess).toHaveBeenCalled()
  })

  it('sends the api_key only when the admin actually typed one', async () => {
    putMock.mockResolvedValue({ data: { enabled: true, endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', has_api_key: true } })

    const wrapper = mountTab()
    await flushPromises()

    await wrapper.find('[data-test="ai-config-endpoint"]').setValue('https://api.openai.com/v1/chat/completions')
    await wrapper.find('[data-test="ai-config-api-key"]').setValue('sk-new-key')
    await wrapper.find('[data-test="ai-config-save"]').trigger('click')
    await flushPromises()

    expect(putMock).toHaveBeenCalledWith('/organizations/org-1/ai-config', expect.objectContaining({ api_key: 'sk-new-key' }))
  })

  it('clears the key input and reflects has_api_key after a successful save', async () => {
    putMock.mockResolvedValue({ data: { enabled: true, endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', has_api_key: true } })

    const wrapper = mountTab()
    await flushPromises()

    await wrapper.find('[data-test="ai-config-api-key"]').setValue('sk-new-key')
    await wrapper.find('[data-test="ai-config-save"]').trigger('click')
    await flushPromises()

    expect((wrapper.find('[data-test="ai-config-api-key"]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('[data-test="ai-config-api-key"]').attributes('placeholder')).toContain('keep')
  })

  it('shows a generic translated message when loading fails, never the raw backend text', async () => {
    getMock.mockRejectedValue({ response: { status: 500, data: { error_code: 500, error_message: 'boom' } } })

    const wrapper = mountTab()
    await flushPromises()

    const error = wrapper.find('[data-test="ai-config-error"]').text()
    expect(error).toContain('Failed to load the AI assistant configuration')
    expect(error).not.toContain('boom')
  })

  it('translates a refused endpoint and keeps the form editable', async () => {
    putMock.mockRejectedValue({ response: { status: 400, data: { error_code: 400, error_message: 'ai_endpoint_invalid' } } })

    const wrapper = mountTab()
    await flushPromises()

    await wrapper.find('[data-test="ai-config-endpoint"]').setValue('https://127.0.0.1/v1/chat/completions')
    await wrapper.find('[data-test="ai-config-save"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="ai-config-error"]').text()).toContain('The endpoint must be a public https:// address.')
    expect(wrapper.find('[data-test="ai-config-save"]').attributes('disabled')).toBeUndefined()
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('says the endpoint must be https and blocks saving until it is', async () => {
    const wrapper = mountTab()
    await flushPromises()

    await wrapper.find('[data-test="ai-config-endpoint"]').setValue('http://api.example.com/v1/chat/completions')
    expect(wrapper.find('[data-test="ai-config-endpoint-help"]').classes()).toContain('ocf-ai-config-invalid')
    expect(wrapper.find('[data-test="ai-config-endpoint-help"]').text()).toContain('https://')
    expect(wrapper.find('[data-test="ai-config-endpoint"]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('[data-test="ai-config-save"]').attributes('disabled')).toBeDefined()

    await wrapper.find('[data-test="ai-config-endpoint"]').setValue('https://api.example.com/v1/chat/completions')
    expect(wrapper.find('[data-test="ai-config-endpoint-help"]').classes()).not.toContain('ocf-ai-config-invalid')
    expect(wrapper.find('[data-test="ai-config-save"]').attributes('disabled')).toBeUndefined()
  })

  it('requires the key again once the endpoint moves away from a stored key', async () => {
    getMock.mockResolvedValue({
      data: { enabled: true, endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', has_api_key: true }
    })
    putMock.mockResolvedValue({ data: { enabled: true, endpoint: 'https://api.mistral.ai/v1/chat/completions', model: 'gpt-4o-mini', has_api_key: true } })

    const wrapper = mountTab()
    await flushPromises()
    const key = () => wrapper.find('[data-test="ai-config-api-key"]')
    const save = () => wrapper.find('[data-test="ai-config-save"]')
    expect(key().attributes('required')).toBeUndefined()

    await wrapper.find('[data-test="ai-config-endpoint"]').setValue('https://api.mistral.ai/v1/chat/completions')
    expect(key().attributes('required')).toBeDefined()
    expect(wrapper.find('[data-test="ai-config-api-key-help"]').text()).toContain('enter the API key again')
    expect(save().attributes('disabled')).toBeDefined()

    await key().setValue('sk-mistral')
    expect(save().attributes('disabled')).toBeUndefined()
    await save().trigger('click')
    await flushPromises()

    expect(putMock).toHaveBeenCalledWith('/organizations/org-1/ai-config', expect.objectContaining({
      endpoint: 'https://api.mistral.ai/v1/chat/completions',
      api_key: 'sk-mistral'
    }))
    // Saved: the new endpoint is now the one the key belongs to.
    expect(key().attributes('required')).toBeUndefined()
  })
})
