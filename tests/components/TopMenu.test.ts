/**
 * The top bar is on every page. Its organization block once crashed with
 * "too much recursion" (a helper rewritten into a call to itself), which took
 * every page down as soon as the user menu opened.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push: vi.fn() })
}))

import TopMenu from '../../src/components/Menus/TopMenu.vue'
import { useOrganizationsStore } from '../../src/stores/organizations'

async function mountWithOrganizations(...organizations: Array<Record<string, unknown>>) {
  const store = useOrganizationsStore() as any
  store.loadOrganizations = vi.fn().mockResolvedValue(undefined)
  store.entities.splice(0, Infinity, ...organizations)
  const wrapper = mount(TopMenu, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} } })],
      stubs: { RouterLink: RouterLinkStub, InstanceBrand: true, BetaBadge: true, LanguageSelector: true }
    }
  })
  await flushPromises()
  await wrapper.get('.user-info').trigger('click')
  return wrapper
}

describe('TopMenu — organization block of the user menu', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('names the current organization and says whether it is personal or a team', async () => {
    const wrapper = await mountWithOrganizations(
      { id: 'org-p', name: 'Mine', organization_type: 'personal' },
      { id: 'org-t', name: 'Acme', organization_type: 'team' }
    )

    const current = wrapper.get('.current-organization-info')
    expect(current.text()).toContain('Mine')
    expect(current.text()).toContain('Personal')

    await wrapper.get('.org-switch-btn').trigger('click')
    const choices = wrapper.findAll('.org-switcher-item').map(item => item.text())
    expect(choices).toHaveLength(2)
    expect(choices[0]).toContain('Personal')
    expect(choices[1]).toContain('Acme')
    expect(choices[1]).toContain('Team')
  })

  it('still calls a legacy organization personal, from its is_personal flag', async () => {
    const wrapper = await mountWithOrganizations({ id: 'org-legacy', name: 'Old', is_personal: true })

    expect(wrapper.get('.current-organization-info').text()).toContain('Personal')
  })
})
