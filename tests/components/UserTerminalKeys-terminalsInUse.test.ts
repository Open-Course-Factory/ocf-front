import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'

const showError = vi.fn()
const post = vi.fn()

vi.mock('axios', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: null }), post: (...args: unknown[]) => post(...args) }
}))
vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key }),
  useStoreTranslations: () => ({ t: (key: string) => key })
}))
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showSuccess: vi.fn(), showError })
}))

import UserTerminalKeys from '../../src/components/Pages/UserTerminalKeys.vue'
import i18n from '../../src/i18n'
import { useUserSettingsStore } from '../../src/stores/userSettings'

const ConfirmingModal = {
  emits: ['confirm'],
  template: '<button class="confirm" @click="$emit(\'confirm\')" />'
}

async function confirmRegeneration() {
  const wrapper = mount(UserTerminalKeys, {
    global: { stubs: { BaseModal: ConfirmingModal, ErrorAlert: true } }
  })
  await flushPromises()
  await wrapper.find('button.confirm').trigger('click')
  await flushPromises()
}

describe('UserTerminalKeys — regeneration refused', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('translates the refusal instead of showing the English server text', async () => {
    post.mockRejectedValue({
      response: { status: 409, data: { reason: 'terminals_in_use', error_message: 'server english text' } }
    })

    await confirmRegeneration()

    expect(showError.mock.calls[0][0]).toBe('terminalKeys.terminalsInUse')
  })

  it('keeps showing the server message for any other failure', async () => {
    post.mockRejectedValue({ response: { status: 500, data: { error_message: 'server failure' } } })

    await confirmRegeneration()

    expect(showError.mock.calls[0][0]).toBe('server failure')
  })
})

// The key's creation date as the page shows it to a user with this language
// and saved zone. 11:30 UTC is already the next day in Auckland (UTC+13) but
// still the same day in Los Angeles (UTC-7).
async function keyCreatedAtText(locale: 'en' | 'fr', savedZone: string) {
  vi.mocked(axios.get).mockResolvedValueOnce({ data: { id: 'key-1', key_name: 'k', is_active: true, created_at: '2026-03-15T11:30:00Z' } })
  const pinia = createPinia()
  setActivePinia(pinia)
  useUserSettingsStore().settings.timezone = savedZone
  i18n.global.locale.value = locale

  const wrapper = mount(UserTerminalKeys, {
    global: { plugins: [i18n, pinia], stubs: { BaseModal: true, ErrorAlert: true } }
  })
  await flushPromises()
  return wrapper.text()
}

describe('UserTerminalKeys — creation date in the user\'s language and time zone', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Whatever the machine's zone, one of the two cases differs from it.
  it.each([
    ['fr', 'Pacific/Auckland', '16/03/2026'],
    ['en', 'America/Los_Angeles', '15/03/2026'],
  ] as const)('shows a %s user in %s the key created on %s', async (locale, timezone, expected) => {
    expect(await keyCreatedAtText(locale, timezone)).toContain(expected)
  })

  it('uses the browser zone when the saved zone is the backend default UTC', async () => {
    // The browser says Auckland, whatever the machine running the tests uses.
    const real = Intl.DateTimeFormat.prototype.resolvedOptions
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (this: Intl.DateTimeFormat) {
      return { ...real.call(this), timeZone: 'Pacific/Auckland' }
    })

    expect(await keyCreatedAtText('fr', 'UTC')).toContain('16/03/2026')
  })
})
