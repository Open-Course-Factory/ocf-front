/**
 * isInactiveClass is the ONE definition of "a class you no longer teach": the
 * console's archived fold and the row's muted state both read it. Since
 * ocf-core#491 a class is inactive when it is archived, and only then — expiry
 * is a hint that the hourly cron will archive it, not an archive.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

import { isInactiveClass } from '../../src/services/domain/scenario/teacherService'

describe('isInactiveClass', () => {
  it('is true for an archived class', () => {
    expect(isInactiveClass({ archived_at: '2026-06-30T00:00:00Z' })).toBe(true)
  })

  it('is false for an open class', () => {
    expect(isInactiveClass({ archived_at: null })).toBe(false)
    expect(isInactiveClass({})).toBe(false)
  })

  it('ignores the transitional is_active and the expiry hint', () => {
    expect(isInactiveClass({ is_active: false, is_expired: true } as any)).toBe(false)
  })
})
