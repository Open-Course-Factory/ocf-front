import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const showError = vi.fn()
const post = vi.fn()

vi.mock('axios', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: null }), post: (...args: unknown[]) => post(...args) }
}))
vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key })
}))
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showSuccess: vi.fn(), showError })
}))

import UserTerminalKeys from '../../src/components/Pages/UserTerminalKeys.vue'

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
