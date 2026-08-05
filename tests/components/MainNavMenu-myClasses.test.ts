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

  /*
   * A class page (/classes/:id/…) is a page OF "Mes classes", not a destination
   * beside it, so the entry has to stay lit there — otherwise the teacher
   * browses a class with nothing selected in the sidebar.
   *
   * `router-link-active` alone cannot say that: the class pages are not under
   * /my-classes. The routes declare their parent entry in their meta instead,
   * and `tests/router/classRoutes.test.ts` pins that every class page carries it.
   */
  it('stays lit on every page of a class, not only on the console', () => {
    expect(menuSource).toMatch(
      /isInMyClassesSection\s*=\s*computed\(\(\)\s*=>\s*route\.meta\.navParent === 'my-classes'\)/,
    )
    expect(menuSource).toMatch(/:class="\{ 'is-section-active': isInMyClassesSection \}"/)
  })

  it('lights it the same way whether it is the console or a class page', () => {
    expect(menuSource).toMatch(
      /\.my-classes-header\.router-link-active,\s*\n\s*\.my-classes-header\.is-section-active \{/,
    )
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
