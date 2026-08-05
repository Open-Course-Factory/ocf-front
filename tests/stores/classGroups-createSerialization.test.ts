/**
 * classGroups beforeCreate hook — payload serialization.
 *
 * The bug pinned here broke class creation from the UI entirely: the generic
 * date field emits "" when untouched and a bare YYYY-MM-DD when set, while the
 * backend decodes expires_at as RFC3339 — both shapes made POST /class-groups
 * return 500, from the console modal and the entity page alike. Found by the
 * teacher-path E2E on its first run.
 *
 * Assertions are on the payload the API actually receives.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

vi.mock('element-plus', () => ({
  ElNotification: vi.fn()
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: () => false,
  logDemoAction: vi.fn(),
  simulateDelay: () => Promise.resolve()
}))

import axios from 'axios'
import { useClassGroupsStore } from '../../src/stores/classGroups'

function postedPayload(): any {
  const calls = (axios.post as any).mock.calls
  expect(calls.length).toBeGreaterThan(0)
  return calls[0][1]
}

describe('classGroups creation payload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    ;(axios.post as any).mockResolvedValue({ data: { id: 'grp-new', organization_id: 'org-1' } })
  })

  it('omits an untouched expiry instead of sending ""', async () => {
    const store = useClassGroupsStore()
    await store.createEntity('/class-groups', {
      display_name: 'Docker E2E',
      organization_id: 'org-1',
      expires_at: '',
      is_active: true
    })

    expect(postedPayload()).not.toHaveProperty('expires_at')
  })

  it('turns a picked YYYY-MM-DD expiry into RFC3339, through that whole day', async () => {
    const store = useClassGroupsStore()
    await store.createEntity('/class-groups', {
      display_name: 'Docker E2E',
      organization_id: 'org-1',
      expires_at: '2027-01-31',
      is_active: true
    })

    const sent = postedPayload().expires_at
    // Valid RFC3339 (Date can parse it back)…
    expect(Number.isNaN(new Date(sent).getTime())).toBe(false)
    // …and pointing at the END of the picked day, local time: an expiry chosen
    // as a date means "through that day", not "at the previous midnight".
    const parsed = new Date(sent)
    expect(parsed.getFullYear()).toBe(2027)
    expect(parsed.getMonth()).toBe(0)
    expect(parsed.getDate()).toBe(31)
    expect(parsed.getHours()).toBe(23)
  })

  it('leaves an already-RFC3339 expiry untouched', async () => {
    const store = useClassGroupsStore()
    await store.createEntity('/class-groups', {
      display_name: 'Docker E2E',
      organization_id: 'org-1',
      expires_at: '2027-01-31T10:00:00Z',
      is_active: true
    })

    expect(postedPayload().expires_at).toBe('2027-01-31T10:00:00Z')
  })

  it('drops an empty parent_group_id instead of sending null', async () => {
    const store = useClassGroupsStore()
    await store.createEntity('/class-groups', {
      display_name: 'Docker E2E',
      organization_id: 'org-1',
      parent_group_id: null,
      is_active: true
    })

    const sent = postedPayload()
    expect(sent).not.toHaveProperty('parent_group_id')
    expect(sent).not.toHaveProperty('parentGroupID')
  })

  it('declares the create form opens active by default', () => {
    const store = useClassGroupsStore()
    expect(store.fieldList.get('is_active')?.defaultValue).toBe(true)
  })
})
