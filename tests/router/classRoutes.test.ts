/**
 * The class routes as the application actually declares them.
 *
 * `classPagesRedirect.test.ts` pins the mapping in isolation; this file proves
 * the router is wired to it — that the five pages exist at the URLs the banner
 * links to, that the retired `/class-groups/:id` path really redirects, and that
 * every class page tells the sidebar which entry it belongs under.
 */

import { describe, it, expect } from 'vitest'
import router from '../../src/router'

/**
 * The URL a redirecting route sends a visitor to.
 *
 * `router.resolve()` stops at the redirecting record — following it is part of
 * navigating, which would drag the authentication guard in. Asking the record
 * itself and resolving what it answers proves the same wiring without it.
 */
function destinationOf(url: string): string {
  const resolved = router.resolve(url)
  const record = resolved.matched.at(-1)
  const redirect = record?.redirect

  if (typeof redirect !== 'function') {
    throw new Error(`${url} does not redirect anywhere`)
  }
  return router.resolve(redirect(resolved) as never).fullPath
}

describe('the five class pages', () => {
  it.each([
    ['/classes/g-1/live', 'ClassLive'],
    ['/classes/g-1/members', 'ClassMembers'],
    ['/classes/g-1/scenarios', 'ClassScenarios'],
    ['/classes/g-1/analytics', 'ClassAnalytics'],
    ['/classes/g-1/settings', 'ClassSettings'],
  ])('serves %s', (path, name) => {
    const resolved = router.resolve(path)
    expect(resolved.name).toBe(name)
    expect(resolved.params.id).toBe('g-1')
  })

  it('opens the live page for a class with no page named', () => {
    expect(destinationOf('/classes/g-1')).toBe('/classes/g-1/live')
  })

  it('shares one layout across all five, so the banner is mounted once', () => {
    const pages = ['live', 'members', 'scenarios', 'analytics', 'settings']
      .map(page => router.resolve(`/classes/g-1/${page}`))

    const layouts = pages.map(page => page.matched.at(-2))
    expect(new Set(layouts).size).toBe(1)
  })

  it('gates them on the same permission and entitlement as the other class pages', () => {
    const { meta } = router.resolve('/classes/g-1/settings')
    expect(meta.requiresAuth).toBe(true)
    expect(meta.requiredPermissions).toEqual(['view_groups'])
    expect(meta.requiresClassroomEntitlement).toBe(true)
  })
})

describe('the sidebar entry a class page belongs under', () => {
  it.each([
    '/my-classes',
    '/classes/g-1/live',
    '/classes/g-1/members',
    '/classes/g-1/scenarios',
    '/classes/g-1/analytics',
    '/classes/g-1/settings',
  ])('declares "Mes classes" as the parent entry of %s', path => {
    expect(router.resolve(path).meta.navParent).toBe('my-classes')
  })

  it('does not claim the entry for the group CRUD list, which left that menu', () => {
    expect(router.resolve('/class-groups').meta.navParent).toBeUndefined()
  })
})

describe('links to the class page that no longer exists', () => {
  it.each([
    ['/class-groups/g-1?tab=overview', '/classes/g-1/settings'],
    ['/class-groups/g-1?tab=members', '/classes/g-1/members'],
    ['/class-groups/g-1?tab=scenarios', '/classes/g-1/scenarios'],
    ['/class-groups/g-1?tab=live', '/classes/g-1/live'],
    ['/class-groups/g-1?tab=activity', '/classes/g-1/live'],
    ['/class-groups/g-1?tab=analytics', '/classes/g-1/analytics'],
    ['/class-groups/g-1?tab=history', '/classes/g-1/analytics?section=history'],
    ['/class-groups/g-1?tab=settings', '/classes/g-1/settings'],
    ['/class-groups/g-1?tab=live&view=wall', '/classes/g-1/live?view=wall'],
    ['/class-groups/g-1', '/classes/g-1/live'],
    ['/class-groups/g-1?tab=bogus', '/classes/g-1/live'],
  ])('sends %s to %s', (oldUrl, newUrl) => {
    expect(destinationOf(oldUrl)).toBe(newUrl)
  })

  it('leaves the group CRUD list itself alone', () => {
    expect(router.resolve('/class-groups').fullPath).toBe('/class-groups')
  })
})
