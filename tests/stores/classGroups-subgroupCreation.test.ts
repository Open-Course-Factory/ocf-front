/**
 * classGroups afterCreate hook — subgroup creation (#305).
 *
 * Two defects pinned here:
 *
 *   1. Per-subgroup failures were swallowed into console.error, so a teacher
 *      creating "Promo 2026" with three TD groups saw plain success even when
 *      two of them never made it to the database.
 *   2. Subgroups inherited the parent's max_members, so a 200-seat promotion
 *      produced 200-seat TD groups. The backend owns that default
 *      (ClassGroup.MaxMembers `gorm:"default:50"`), so the payload must omit it.
 *
 * Assertions are on what the teacher ends up seeing: the notification text
 * produced by the real i18n bundle, and the rows actually sent to the API.
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
import { ElNotification } from 'element-plus'
import i18n from '../../src/i18n'
import { useClassGroupsStore } from '../../src/stores/classGroups'

const PARENT = { id: 'grp-parent', display_name: 'Promo 2026', organization_id: 'org-1' }

/** Payloads POSTed to /class-groups, excluding the parent group itself. */
function subgroupPayloads(): any[] {
  return (axios.post as any).mock.calls
    .map((call: any[]) => call[1])
    .filter((payload: any) => payload.parent_group_id === PARENT.id)
}

function lastNotification(): any {
  const calls = (ElNotification as any).mock.calls
  return calls.length > 0 ? calls[calls.length - 1][0] : null
}

/**
 * POST /class-groups succeeds for the parent and for every subgroup whose
 * display_name is not listed in `failing`.
 */
function mockCreatesFailingFor(failing: string[]) {
  ;(axios.post as any).mockImplementation(async (_url: string, payload: any) => {
    if (payload.parent_group_id !== PARENT.id) {
      return { data: PARENT }
    }
    if (failing.includes(payload.display_name)) {
      throw new Error(`quota exceeded for ${payload.display_name}`)
    }
    return { data: { id: `grp-${payload.name}`, ...payload } }
  })
}

async function createPromotionWith(subgroupNames: string, maxMembers = 200) {
  const store = useClassGroupsStore()
  await store.createEntity('/class-groups', {
    display_name: PARENT.display_name,
    organization_id: PARENT.organization_id,
    max_members: maxMembers,
    is_active: true,
    subgroup_names: subgroupNames
  })
  return store
}

describe('classGroups — subgroup creation after a class is created (#305)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    i18n.global.locale.value = 'en'
  })

  it('creates one subgroup per line and reports nothing when all succeed', async () => {
    mockCreatesFailingFor([])

    await createPromotionWith('TD 1\nTD 2\nTD 3')

    expect(subgroupPayloads().map(p => p.display_name)).toEqual(['TD 1', 'TD 2', 'TD 3'])
    expect(ElNotification).not.toHaveBeenCalled()
  })

  it('does not give subgroups the parent class size limit', async () => {
    mockCreatesFailingFor([])

    await createPromotionWith('TD 1', 200)

    const [subgroup] = subgroupPayloads()
    expect(subgroup).not.toHaveProperty('max_members')
  })

  it('warns the teacher and names the subgroups that failed when only some succeed', async () => {
    mockCreatesFailingFor(['TD 2'])

    await createPromotionWith('TD 1\nTD 2\nTD 3')

    // The two that worked were still created — a partial failure must not roll back.
    expect(subgroupPayloads()).toHaveLength(3)

    const notification = lastNotification()
    expect(notification).not.toBeNull()
    expect(notification.type).toBe('warning')
    expect(notification.message).toContain('TD 2')
    expect(notification.message).not.toContain('TD 1')
    expect(notification.message).toContain('2')
    expect(notification.message).toContain('3')
  })

  it('reports an error naming every subgroup when none could be created', async () => {
    mockCreatesFailingFor(['TD 1', 'TD 2'])

    await createPromotionWith('TD 1\nTD 2')

    const notification = lastNotification()
    expect(notification).not.toBeNull()
    expect(notification.type).toBe('error')
    expect(notification.message).toContain('TD 1')
    expect(notification.message).toContain('TD 2')
  })

  it('creates nothing and reports nothing when the subgroup field is left empty', async () => {
    mockCreatesFailingFor([])

    await createPromotionWith('')

    expect(subgroupPayloads()).toHaveLength(0)
    expect(ElNotification).not.toHaveBeenCalled()
  })

  it('ignores blank and whitespace-only lines instead of creating unnamed groups', async () => {
    mockCreatesFailingFor([])

    await createPromotionWith('\n  \nTD 1\n\n   \n')

    expect(subgroupPayloads().map(p => p.display_name)).toEqual(['TD 1'])
    expect(ElNotification).not.toHaveBeenCalled()
  })

  it('does not send subgroup_names to the backend', async () => {
    mockCreatesFailingFor([])

    await createPromotionWith('TD 1')

    for (const [, payload] of (axios.post as any).mock.calls) {
      expect(payload).not.toHaveProperty('subgroup_names')
    }
  })
})
