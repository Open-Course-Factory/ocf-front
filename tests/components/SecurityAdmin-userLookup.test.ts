import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { reactive } from 'vue'

const store = reactive({
  isLoading: false,
  error: '',
  policyOverview: null,
  userPermissions: null,
  entityRoleMatrix: null,
  healthChecks: null,
  fetchPolicyOverview: vi.fn(),
  fetchUserPermissions: vi.fn(),
  fetchEntityRoleMatrix: vi.fn(),
  fetchHealthChecks: vi.fn()
})

vi.mock('../../src/stores/securityAdmin', () => ({
  useSecurityAdminStore: () => store
}))

vi.mock('../../src/services/domain/user', () => ({
  userService: { searchUsers: vi.fn() }
}))

import Security from '../../src/components/Pages/Admin/Security.vue'
import { userService } from '../../src/services/domain/user'

const alice = { id: 'alice-id', name: 'alice', email: 'alice@example.com' }
const uuid = '0f8fad5b-d9cb-469f-a165-70867728950e'

async function mountUserTab() {
  const wrapper = mount(Security, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })]
    }
  })
  await wrapper.findAll('.tab-button')[1].trigger('click')
  return wrapper
}

async function type(wrapper: VueWrapper, query: string) {
  const input = wrapper.find('.user-search-container input')
  await input.trigger('focus')
  await input.setValue(query)
  await vi.advanceTimersByTimeAsync(1000)
  await flushPromises()
}

const searchButton = (wrapper: VueWrapper) => wrapper.find('.search-bar button')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  store.fetchUserPermissions.mockClear()
  vi.mocked(userService.searchUsers).mockClear()
  vi.mocked(userService.searchUsers).mockImplementation(async (q: string) => (q.startsWith('al') ? [alice] as any : []))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Security admin: user permission lookup', () => {
  it('looks up a picked user once, and never again once the text is edited', async () => {
    const wrapper = await mountUserTab()
    // Two keystrokes: with a single one the search below is lost (see DEFECT).
    await type(wrapper, 'al')
    await type(wrapper, 'ali')
    await wrapper.find('.search-result').trigger('click')
    await flushPromises()

    expect(store.fetchUserPermissions).toHaveBeenCalledTimes(1)
    expect(store.fetchUserPermissions).toHaveBeenCalledWith('alice-id')

    await type(wrapper, 'alice (alice@example.com) x')
    await searchButton(wrapper).trigger('click')

    expect(store.fetchUserPermissions).toHaveBeenCalledTimes(1)
  })

  it('looks up a raw UUID typed in the box when Enter is pressed', async () => {
    const wrapper = await mountUserTab()
    await type(wrapper, uuid)

    await wrapper.find('.user-search-container input').trigger('keyup', { key: 'Enter' })

    expect(store.fetchUserPermissions).toHaveBeenCalledWith(uuid)
  })

  // RED ON PURPOSE (defect): the page binds v-model:query, so inside onInput
  // `query.value` is still the previous prop value: every search uses the text
  // as it was one keystroke earlier, and a paste searches nothing.
  it('searches the full text the admin just typed', async () => {
    const wrapper = await mountUserTab()
    await type(wrapper, 'al')
    await type(wrapper, 'alic')

    expect(userService.searchUsers).toHaveBeenLastCalledWith('alic')
  })

  it('disables Search while the box is empty', async () => {
    const wrapper = await mountUserTab()
    expect(searchButton(wrapper).attributes('disabled')).toBeDefined()

    await type(wrapper, 'al')
    expect(searchButton(wrapper).attributes('disabled')).toBeUndefined()
  })
})
