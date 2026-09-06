import { describe, it, expect } from 'vitest'
import { classroomRefusalRedirect } from '../../src/router/classroomGuard'
import type { UserEffectiveFeatures } from '../../src/types/user'

function features(canRunClassrooms: boolean): UserEffectiveFeatures {
  return {
    user_id: 'user-1',
    effective_features: { id: 'plan', name: 'Plan', features: [] } as any,
    source_organizations: [],
    has_personal_subscription: true,
    can_run_classrooms: canRunClassrooms
  } as UserEffectiveFeatures
}

describe('classroomRefusalRedirect', () => {
  it('sends a refused user to the console, which explains the way out', () => {
    expect(classroomRefusalRedirect(features(false))).toEqual({ name: 'MyClasses' })
  })

  it('lets an entitled user through', () => {
    expect(classroomRefusalRedirect(features(true))).toBeNull()
  })

  it('lets the page load when no verdict arrived, leaving the refusal to the backend', () => {
    expect(classroomRefusalRedirect(null)).toBeNull()
    expect(classroomRefusalRedirect(undefined)).toBeNull()
  })
})
