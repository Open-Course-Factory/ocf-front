/**
 * "Mes classes" is the teacher's home, so it sits ABOVE the categories in the
 * sidebar rather than inside Groups (issue #309).
 *
 * It is still the same feature as the Groups category, and its visibility must
 * come from that category's own verdict rather than from a second copy of the
 * flag / permission / plan conditions — a fork there is how a menu entry ends
 * up leading somewhere the user cannot go.
 *
 * Strategy follows MainNavMenu.test.ts and MainNavMenu-groupMembersEntry.test.ts:
 * mounting MainNavMenu needs 15+ stubbed stores, so the declaration is asserted
 * at the source and the click-through is covered by the Playwright specs.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const menuSource = readFileSync(
  resolve(__dirname, '../../src/components/Menus/MainNavMenu.vue'),
  'utf-8',
)
const routerSource = readFileSync(
  resolve(__dirname, '../../src/router/index.ts'),
  'utf-8',
)
const i18nSource = readFileSync(resolve(__dirname, '../../src/i18n.ts'), 'utf-8')

describe('MainNavMenu — "My classes" entry', () => {
  it('links to the console', () => {
    expect(menuSource).toMatch(/to="\/my-classes"/)
  })

  it('sits in the top block, above the categories', () => {
    const topBlock = menuSource.indexOf('class="menu-top"')
    const entry = menuSource.indexOf('to="/my-classes"')
    const firstCategory = menuSource.indexOf('<NavCategory')

    expect(entry).toBeGreaterThan(topBlock)
    expect(entry).toBeLessThan(firstCategory)
  })

  it('takes its visibility from the Groups category instead of re-deriving it', () => {
    expect(menuSource).toMatch(/showMyClasses\s*=\s*computed\(\(\)\s*=>\s*groupsCategory\.value/)
    expect(menuSource).toMatch(/groupsCategory\s*=\s*computed\([\s\S]{0,160}category\.key === 'groups'/)
  })

  it('is never disabled — in a personal context it is the door to org creation', () => {
    // The entry must stay a plain always-clickable router-link: the console
    // renders the right state per context (#315), and in a personal org it is
    // the only path to creating a team org (Organizations category is hidden).
    expect(menuSource).not.toMatch(/myClassesDisabled/)
    expect(menuSource).toMatch(/<router-link[\s\S]{0,80}to="\/my-classes"/)
  })

  it('grays the Groups category on the classroom verdict, not on plan features alone', () => {
    // #475: the org-aware verdict is authoritative — a Formateur plan grants
    // groups, but a personal org never enables them. The category must read
    // canRunClassrooms and name the personal_organization reason.
    expect(menuSource).toMatch(/category\.key === 'groups' && !canRunClassrooms\.value/)
    expect(menuSource).toMatch(/personal_organization/)
    expect(menuSource).toMatch(/classroomsNeedOrganization/)
  })

  it('names itself in both locales', () => {
    expect(i18nSource).toMatch(/myClasses:\s*'My classes'/)
    expect(i18nSource).toMatch(/myClasses:\s*'Mes classes'/)
    expect(i18nSource).toMatch(/myClassesTitle:\s*'Your classes/)
    expect(i18nSource).toMatch(/myClassesTitle:\s*'Vos classes/)
  })

  it('registers the route it points at', () => {
    expect(routerSource).toMatch(/path:\s*'my-classes',\s*name:\s*'MyClasses'/)
  })

  it('gates the route on the same permission as the other group pages', () => {
    const route = routerSource.match(/path: 'my-classes'.*/)?.[0] ?? ''
    expect(route).toContain("requiredPermissions: ['view_groups']")
    expect(route).toContain('requiresAuth: true')
  })
})
