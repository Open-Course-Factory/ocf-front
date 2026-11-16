import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

// POST /users/me/change-password answers { error: "<reason>" }.
const changePassword = vi.fn()

vi.mock('../../src/stores/userSettings', () => ({
  useUserSettingsStore: () => ({ settings: {}, isLoading: false, changePassword }),
}))
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ logout: vi.fn() }),
}))
vi.mock('../../src/composables/useFormatters', () => ({
  useFormatters: () => ({ formatDate: (d: string) => d }),
}))

import SecuritySettings from '../../src/components/Settings/SecuritySettings.vue'

function mountSettings() {
  return mount(SecuritySettings, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: { SettingsCard: { template: '<div><slot /></div>' }, BaseModal: true },
    },
  })
}

describe('SecuritySettings change password', () => {
  it('shows the reason the backend gives', async () => {
    changePassword.mockRejectedValue({
      response: { status: 401, data: { error: 'current password is incorrect' } },
      message: 'Request failed with status code 401',
    })
    const wrapper = mountSettings()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue('old-password')
    await inputs[1].setValue('new-password-123')
    await inputs[2].setValue('new-password-123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.error-message').text()).toBe('current password is incorrect')
  })
})
