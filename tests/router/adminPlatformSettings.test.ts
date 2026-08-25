/**
 * The platform-settings admin page, as the application declares it.
 *
 * It is where an administrator edits the settings modules register at startup —
 * including the terminal launcher's hidden-distribution list, which is why the
 * page was added. Two things have to hold: the URL the admin menu links to must
 * resolve to a real page, and it must be behind the admin guard, since the
 * settings it edits change platform behaviour for everyone.
 */

import { describe, it, expect } from 'vitest'
import router from '../../src/router'

describe('the platform settings admin page', () => {
  it('resolves at the URL the admin menu links to', () => {
    const resolved = router.resolve('/admin/platform-settings')

    expect(resolved.name).toBe('AdminPlatformSettings')
    expect(resolved.matched.length, 'the path must match a declared route').toBeGreaterThan(0)
  })

  it('is behind the admin guard, not merely behind login', () => {
    const resolved = router.resolve('/admin/platform-settings')

    expect(resolved.meta.requiresAuth).toBe(true)
    expect(
      resolved.meta.requiresAdmin,
      'these settings change platform behaviour for everyone — a signed-in member must not reach them'
    ).toBe(true)
  })

  it('sits alongside the other admin pages rather than under a settings shell', () => {
    // isSettings drives the sidebar's back-navigation, and this page is not
    // part of the per-user settings area.
    expect(router.resolve('/admin/platform-settings').meta.isSettings).toBeFalsy()
  })
})

describe('the distribution catalogue admin page', () => {
  it('resolves at the URL the admin menu links to', () => {
    expect(router.resolve('/admin/distribution-catalog').name).toBe('AdminDistributionCatalog')
  })

  it('is behind the admin guard', () => {
    // It decides what every user is offered, and it is the only screen that can
    // give a withheld environment its visibility back.
    const resolved = router.resolve('/admin/distribution-catalog')
    expect(resolved.meta.requiresAuth).toBe(true)
    expect(resolved.meta.requiresAdmin).toBe(true)
  })
})
