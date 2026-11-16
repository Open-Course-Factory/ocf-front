import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import axios from 'axios'

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}))

import UserSearchInput from '../../src/components/Common/UserSearchInput.vue'

const alice = { id: 'alice-id', name: 'alice', display_name: 'Alice Martin', email: 'alice@example.com' }
const albert = { id: 'albert-id', name: 'albert', email: 'albert@example.com' }

function results(q: string) {
  return [alice, albert].filter(u => u.name.startsWith(q.toLowerCase()))
}

function searchCalls() {
  return vi.mocked(axios.get).mock.calls.filter(([url]) => url === '/users/search')
}

function mountInput(modelValue = '') {
  const wrapper = mount(UserSearchInput, {
    props: {
      modelValue,
      placeholder: 'Search a user',
      'onUpdate:modelValue': (id: string) => wrapper.setProps({ modelValue: id })
    },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })]
    }
  })
  return wrapper
}

async function settle() {
  await vi.advanceTimersByTimeAsync(1000)
  await flushPromises()
}

async function type(wrapper: VueWrapper, query: string) {
  const input = wrapper.find('input')
  await input.trigger('focus')
  await input.setValue(query)
}

function lastEmitted(wrapper: VueWrapper) {
  const events = wrapper.emitted('update:modelValue') ?? []
  return events[events.length - 1]?.[0]
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  vi.mocked(axios.get).mockReset().mockImplementation(async (url: string, config?: any) =>
    url === '/users/search' ? { data: results(config?.params?.q ?? '') } : { data: [] }
  )
})

afterEach(() => {
  vi.useRealTimers()
})

describe('UserSearchInput', () => {
  it('shows the placeholder it is given', () => {
    expect(mountInput().find('input').attributes('placeholder')).toBe('Search a user')
  })

  it('searches GET /users/search with the typed query', async () => {
    const wrapper = mountInput()
    await type(wrapper, 'ali')
    await settle()

    expect(searchCalls()).toHaveLength(1)
    expect(searchCalls()[0][1]).toMatchObject({ params: { q: 'ali' } })
  })

  it('sends one request for a burst of keystrokes, with the last query', async () => {
    const wrapper = mountInput()
    await type(wrapper, 'al')
    await type(wrapper, 'ali')
    await type(wrapper, 'alic')
    await settle()

    expect(searchCalls()).toHaveLength(1)
    expect(searchCalls()[0][1]).toMatchObject({ params: { q: 'alic' } })
  })

  it('does not search below two characters', async () => {
    const wrapper = mountInput()
    await type(wrapper, 'a')
    await settle()

    expect(searchCalls()).toHaveLength(0)
    expect(wrapper.find('.search-dropdown').exists()).toBe(false)
  })

  it('lists each result by display name, else name, with its email', async () => {
    const wrapper = mountInput()
    await type(wrapper, 'al')
    await settle()

    const rows = wrapper.findAll('.search-result')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Alice Martin')
    expect(rows[0].text()).toContain('alice@example.com')
    expect(rows[1].text()).toContain('albert')
    expect(rows[1].text()).toContain('albert@example.com')
  })

  it('shows a "no user found" row when the search matches nobody', async () => {
    const wrapper = mountInput()
    await type(wrapper, 'zed')
    await settle()

    expect(wrapper.find('.search-empty').exists()).toBe(true)
    expect(wrapper.find('.search-empty').text()).not.toBe('')
    expect(wrapper.findAll('.search-result')).toHaveLength(0)
  })

  it('emits the picked user id and shows the user in the input', async () => {
    const wrapper = mountInput()
    await type(wrapper, 'ali')
    await settle()

    await wrapper.find('.search-result').trigger('click')

    expect(lastEmitted(wrapper)).toBe('alice-id')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Alice Martin (alice@example.com)')
    expect(wrapper.find('.search-dropdown').exists()).toBe(false)
  })

  it('emits an empty id as soon as the query is edited after a pick', async () => {
    const wrapper = mountInput()
    await type(wrapper, 'ali')
    await settle()
    await wrapper.find('.search-result').trigger('click')
    expect(lastEmitted(wrapper)).toBe('alice-id')

    await type(wrapper, 'bob')

    expect(lastEmitted(wrapper)).toBe('')
  })

  it('closes the dropdown on blur', async () => {
    const wrapper = mountInput()
    await type(wrapper, 'ali')
    await settle()
    expect(wrapper.find('.search-dropdown').exists()).toBe(true)

    await wrapper.find('input').trigger('blur')
    await settle()

    expect(wrapper.find('.search-dropdown').exists()).toBe(false)
  })

  it('keeps the dropdown open when focus returns before the blur delay ends', async () => {
    const wrapper = mountInput()
    await type(wrapper, 'ali')
    await settle()

    await wrapper.find('input').trigger('blur')
    await vi.advanceTimersByTimeAsync(50)
    await type(wrapper, 'alb')
    await settle()

    expect(wrapper.find('.search-dropdown').exists()).toBe(true)
    expect(wrapper.find('.search-result').text()).toContain('albert')
  })
})

describe('UserSearchInput out-of-order responses', () => {
  // RED ON PURPOSE (defect): nothing ties a response to the query that asked
  // for it, so a slow earlier answer overwrites the newer one.
  it('keeps the latest query\'s results when an earlier response arrives last', async () => {
    const pending: Record<string, (users: unknown[]) => void> = {}
    vi.mocked(axios.get).mockImplementation((_url: string, config?: any) =>
      new Promise(resolve => { pending[config.params.q] = users => resolve({ data: users }) })
    )
    const wrapper = mountInput()

    await type(wrapper, 'ali')
    await vi.advanceTimersByTimeAsync(300)
    await type(wrapper, 'alb')
    await vi.advanceTimersByTimeAsync(300)

    pending.alb([albert])
    await flushPromises()
    pending.ali([alice])
    await flushPromises()

    const rows = wrapper.findAll('.search-result')
    expect(rows).toHaveLength(1)
    expect(rows[0].text()).toContain('albert')
  })

  it('stays "searching" when only the stale response has arrived', async () => {
    const pending: Record<string, (users: unknown[]) => void> = {}
    vi.mocked(axios.get).mockImplementation((_url: string, config?: any) =>
      new Promise(resolve => { pending[config.params.q] = users => resolve({ data: users }) })
    )
    const wrapper = mountInput()

    await type(wrapper, 'ali')
    await vi.advanceTimersByTimeAsync(300)
    await type(wrapper, 'alb')
    await vi.advanceTimersByTimeAsync(300)

    pending.ali([alice])
    await flushPromises()

    expect(wrapper.find('.search-loading').exists()).toBe(true)
    expect(wrapper.findAll('.search-result')).toHaveLength(0)
  })
})
