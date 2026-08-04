/**
 * Group cards must name the organization and the parent group (issue #301).
 *
 * Before this test, GroupCard rendered the translated field LABELS
 * ("Organisation" / "Groupe parent") in place of the values, so every card on
 * the Groups page carried the same two meaningless lines.
 *
 * `/class-groups` returns only `organization_id` / `parent_group_id`, so the
 * names are resolved on the page from lists the session already holds — the
 * organization switcher's list and the group list itself. Nothing here may
 * trigger a request per card, and an ID that resolves to nothing must drop the
 * line rather than print a raw UUID at the teacher.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

// ---- Mocks (must be before component imports) ----

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

vi.mock('vue-router', () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    onError: vi.fn(),
    isReady: vi.fn().mockResolvedValue(undefined),
    addRoute: vi.fn(),
    getRoutes: () => [],
    resolve: (to: unknown) => ({ href: '#', ...(to as object) }),
    currentRoute: { value: { query: {}, params: {}, meta: {} } },
  }
  return {
    useRouter: () => router,
    useRoute: () => ({ query: {}, params: {}, meta: {} }),
    createRouter: () => router,
    createWebHistory: () => ({}),
    createWebHashHistory: () => ({}),
  }
})

const groupEntities: any[] = []
vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({
    entities: groupEntities,
    fieldList: [],
    loadEntities: vi.fn().mockResolvedValue([]),
  }),
}))

const organizationEntities: any[] = []
vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    organizations: organizationEntities,
    getOrganizationById: (id: string) =>
      organizationEntities.find((org) => org.id === id),
  }),
}))

import ClassGroups from '../../src/components/Pages/ClassGroups.vue'

const messages = {
  en: {
    classGroups: {
      organization_id: 'Organization',
      parent_group_id: 'Parent group',
      member_count: 'Current members',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      statusFull: 'FULL',
      statusExpired: 'EXPIRED',
    },
  },
  fr: {
    classGroups: {
      organization_id: 'Organisation',
      parent_group_id: 'Groupe parent',
      member_count: 'Membres actuels',
      statusActive: 'Actif',
      statusInactive: 'Inactif',
      statusFull: 'COMPLET',
      statusExpired: 'EXPIRÉ',
    },
  },
}

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages,
    missingWarn: false,
    fallbackWarn: false,
  })
}

/**
 * Mount the Groups page with Entity.vue stubbed so its `#card` slot renders
 * once per group. GroupCard itself stays real — the point of the test is what
 * the teacher reads on the card.
 */
function mountGroups(groups: any[], organizations: any[]) {
  groupEntities.length = 0
  groupEntities.push(...groups)
  organizationEntities.length = 0
  organizationEntities.push(...organizations)
  setActivePinia(createPinia())

  return mount(ClassGroups, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        Entity: {
          props: ['entityName', 'entityStore'],
          template: `
            <div class="entity-stub">
              <div
                v-for="entity in entityStore.entities"
                :key="entity.id"
                class="entity-row"
                :data-entity-id="entity.id"
              >
                <slot name="card" :entity="entity" />
              </div>
            </div>
          `,
        },
      },
    },
  })
}

const acme = { id: 'org-1', display_name: 'ACME Corporation' }

const rootGroup = {
  id: 'grp-root',
  name: 'promo-2026',
  display_name: 'Promo 2026',
  organization_id: 'org-1',
  member_count: 3,
  max_members: 30,
  is_active: true,
}

const subGroup = {
  id: 'grp-child',
  name: 'promo-2026-td1',
  display_name: 'TD1',
  organization_id: 'org-1',
  parent_group_id: 'grp-root',
  member_count: 1,
  max_members: 15,
  is_active: true,
}

function cardOf(wrapper: ReturnType<typeof mountGroups>, groupId: string) {
  return wrapper.find(`[data-entity-id="${groupId}"]`)
}

describe('Groups page — card organization and parent-group lines', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('names the organization instead of repeating the field label', () => {
    const wrapper = mountGroups([rootGroup], [acme])
    const line = cardOf(wrapper, 'grp-root').find('[data-test="meta-organization"]')

    expect(line.exists()).toBe(true)
    expect(line.text()).toContain('ACME Corporation')
    expect(line.text()).not.toContain('Organization')
    expect(line.text()).not.toContain('org-1')
  })

  it('names the parent group instead of repeating the field label', () => {
    const wrapper = mountGroups([rootGroup, subGroup], [acme])
    const line = cardOf(wrapper, 'grp-child').find('[data-test="meta-parent-group"]')

    expect(line.exists()).toBe(true)
    expect(line.text()).toContain('Promo 2026')
    expect(line.text()).not.toContain('Parent group')
    expect(line.text()).not.toContain('grp-root')
  })

  it('drops the organization line when the organization is not in the loaded list', () => {
    const wrapper = mountGroups([rootGroup], [])
    const card = cardOf(wrapper, 'grp-root')

    expect(card.find('[data-test="meta-organization"]').exists()).toBe(false)
    expect(card.text()).not.toContain('org-1')
  })

  it('drops the parent-group line when the parent is not in the loaded list', () => {
    const wrapper = mountGroups([subGroup], [acme])
    const card = cardOf(wrapper, 'grp-child')

    expect(card.find('[data-test="meta-parent-group"]').exists()).toBe(false)
    expect(card.text()).not.toContain('grp-root')
  })

  it('renders no parent-group line for a top-level group', () => {
    const wrapper = mountGroups([rootGroup], [acme])

    expect(cardOf(wrapper, 'grp-root').find('[data-test="meta-parent-group"]').exists()).toBe(false)
  })

  it('falls back to the parent slug when the parent has no display name', () => {
    const wrapper = mountGroups(
      [{ ...rootGroup, display_name: '' }, subGroup],
      [acme],
    )
    const line = cardOf(wrapper, 'grp-child').find('[data-test="meta-parent-group"]')

    expect(line.exists()).toBe(true)
    expect(line.text()).toContain('promo-2026')
  })
})
