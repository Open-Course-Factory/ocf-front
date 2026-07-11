import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import axios from 'axios'

// ---- Mocks (must be before component imports) ----

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

// Shared, test-controlled store state. The page consumes three stores; we mock
// them at the store boundary and drive the page's inputs directly. The method
// names below (loadOrganizations, updateOrganizationBackendConfig,
// fetchBackends, ensurePlansLoaded, formatPrice) and the read-only props
// (organizations, backends, entities) form the contract the rewrite must keep.
const shared = vi.hoisted(() => ({
  orgs: [] as any[],
  backends: [] as any[],
  plans: [] as any[],
  loadOrganizations: vi.fn(),
  updateOrganizationBackendConfig: vi.fn(),
  fetchBackends: vi.fn(),
  ensurePlansLoaded: vi.fn(),
  formatPrice: vi.fn((amount: number, currency: string) => `${(amount / 100).toFixed(2)} ${currency}`)
}))

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    get organizations() {
      return shared.orgs
    },
    loadOrganizations: shared.loadOrganizations,
    updateOrganizationBackendConfig: shared.updateOrganizationBackendConfig
  })
}))

vi.mock('../../src/stores/terminalBackends', () => ({
  useTerminalBackendsStore: () => ({
    get backends() {
      return shared.backends
    },
    fetchBackends: shared.fetchBackends
  })
}))

vi.mock('../../src/stores/subscriptionPlans', () => ({
  useSubscriptionPlansStore: () => ({
    get entities() {
      return shared.plans
    },
    ensurePlansLoaded: shared.ensurePlansLoaded,
    formatPrice: shared.formatPrice
  })
}))

import AdminOrganizations from '../../src/components/Pages/Admin/AdminOrganizations.vue'

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
}

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

function makeOrg(overrides: Partial<any> = {}): any {
  return {
    id: 'org1',
    name: 'acme',
    display_name: 'Acme Corp',
    organization_type: 'team',
    member_count: 5,
    allowed_backends: [],
    default_backend: '',
    incus_ui_enabled: false,
    ...overrides
  }
}

function mountPage() {
  const i18n = createTestI18n()
  setActivePinia(createPinia())

  return mount(AdminOrganizations, {
    global: {
      plugins: [i18n],
      stubs: {
        AdminOrgPlanModal: {
          name: 'AdminOrgPlanModal',
          props: [
            'visible',
            'organizationId',
            'organizationName',
            'currentPlanId',
            'currentSubscription'
          ],
          template:
            '<div class="plan-modal-stub" :data-visible="String(visible)" :data-org-id="organizationId" :data-org-name="organizationName"></div>'
        }
      }
    }
  })
}

// Find a page-level action button by its rendered label (Button renders a
// native <button> with the label in its text). Rewrite-proof: labels come from
// t() and stay stable across the EntityTable migration.
function findButtonByText(wrapper: any, label: string) {
  return wrapper.findAll('button').find((b: any) => b.text().trim() === label)
}

describe('AdminOrganizations (characterization)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    shared.orgs = []
    shared.backends = []
    shared.plans = []
    // Default: bulk subscriptions fetch returns nothing.
    mockedAxios.get.mockResolvedValue({ data: { data: [] } })
    mockedAxios.patch.mockResolvedValue({})
  })

  it('orchestrates the base loads and the bulk subscriptions fetch on mount', async () => {
    shared.orgs = [makeOrg()]
    const wrapper = mountPage()
    await flushPromises()

    expect(shared.loadOrganizations).toHaveBeenCalled()
    expect(shared.fetchBackends).toHaveBeenCalled()
    expect(shared.ensurePlansLoaded).toHaveBeenCalled()
    expect(mockedAxios.get).toHaveBeenCalledWith('/admin/organizations/subscriptions')

    wrapper.unmount()
  })

  it('renders one row per organization with display names visible', async () => {
    shared.orgs = [
      makeOrg({ id: 'org1', display_name: 'Acme Corp' }),
      makeOrg({ id: 'org2', display_name: 'Beta Inc' }),
      makeOrg({ id: 'org3', display_name: 'Gamma LLC' })
    ]
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.findAll('tbody tr').length).toBe(3)
    const text = wrapper.text()
    expect(text).toContain('Acme Corp')
    expect(text).toContain('Beta Inc')
    expect(text).toContain('Gamma LLC')
  })

  it('shows the member count for each organization', async () => {
    shared.orgs = [makeOrg({ display_name: 'Acme Corp', member_count: 42 })]
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('42')
  })

  it('renders distinct type badges for personal and team organizations', async () => {
    shared.orgs = [
      makeOrg({ id: 'p', display_name: 'Personal Org', organization_type: 'personal' }),
      makeOrg({ id: 't', display_name: 'Team Org', organization_type: 'team' })
    ]
    const wrapper = mountPage()
    await flushPromises()

    const badges = wrapper.findAll('.type-badge')
    expect(badges.length).toBe(2)
    const badgeTexts = badges.map((b: any) => b.text())
    expect(badgeTexts).toContain('Personal')
    expect(badgeTexts).toContain('Team')
    // Distinct leaf classes drive the color variants the rewrite must keep.
    expect(wrapper.find('.type-personal').exists()).toBe(true)
    expect(wrapper.find('.type-team').exists()).toBe(true)
  })

  it('resolves and renders the plan name for an organization with a subscription', async () => {
    shared.orgs = [makeOrg({ id: 'org1', display_name: 'Acme Corp' })]
    mockedAxios.get.mockResolvedValue({
      data: {
        data: [
          {
            organization_id: 'org1',
            subscription_plan_id: 'plan-pro',
            subscription_plan: {
              id: 'plan-pro',
              name: 'Pro Plan',
              price_amount: 3900,
              currency: 'EUR',
              billing_interval: 'month'
            }
          }
        ]
      }
    })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Pro Plan')
    expect(wrapper.find('.plan-name').text()).toBe('Pro Plan')
  })

  it('shows the no-plan fallback for an organization without a subscription', async () => {
    shared.orgs = [makeOrg({ id: 'org1', display_name: 'Acme Corp' })]
    // Default axios.get returns empty subscriptions.
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('No plan')
  })

  it('renders allowed backends as tags and the system-default fallback otherwise', async () => {
    shared.backends = [
      { id: 'b1', name: 'Backend One', connected: true, is_default: false, is_active: true }
    ]
    shared.orgs = [
      makeOrg({ id: 'withBackend', display_name: 'Has Backend', allowed_backends: ['b1'] }),
      makeOrg({ id: 'noBackend', display_name: 'No Backend', allowed_backends: [] })
    ]
    const wrapper = mountPage()
    await flushPromises()

    const tags = wrapper.findAll('.backend-tag')
    expect(tags.length).toBe(1)
    expect(tags[0].text()).toBe('Backend One')
    expect(wrapper.text()).toContain('System default')
  })

  it('filters visible rows by organization type', async () => {
    shared.orgs = [
      makeOrg({ id: 'p', display_name: 'Personal Org', organization_type: 'personal' }),
      makeOrg({ id: 't', display_name: 'Team Org', organization_type: 'team' })
    ]
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.findAll('tbody tr').length).toBe(2)

    await wrapper.find('select').setValue('personal')
    await nextTick()

    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(1)
    expect(rows[0].text()).toContain('Personal Org')
  })

  it('filters visible rows by search query', async () => {
    shared.orgs = [
      makeOrg({ id: 'org1', name: 'acme', display_name: 'Acme Corp' }),
      makeOrg({ id: 'org2', name: 'beta', display_name: 'Beta Inc' })
    ]
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('input[type="text"]').setValue('beta')
    await nextTick()

    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(1)
    expect(rows[0].text()).toContain('Beta Inc')
  })

  it('sorts rows by the organization column when its header is toggled', async () => {
    shared.orgs = [
      makeOrg({ id: 'org1', display_name: 'Acme Corp' }),
      makeOrg({ id: 'org2', display_name: 'Beta Inc' })
    ]
    const wrapper = mountPage()
    await flushPromises()

    // Default sort is ascending by display_name.
    let rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('Acme Corp')
    expect(rows[1].text()).toContain('Beta Inc')

    const orgHeader = wrapper
      .findAll('th')
      .find((th: any) => th.text().includes('Organization'))
    expect(orgHeader).toBeTruthy()
    await orgHeader!.trigger('click')
    await nextTick()

    rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('Beta Inc')
    expect(rows[1].text()).toContain('Acme Corp')
  })

  it('opens the backend-config modal prefilled with the org config', async () => {
    shared.backends = [
      { id: 'b1', name: 'Backend One', connected: true, is_default: false, is_active: true }
    ]
    shared.orgs = [
      makeOrg({
        id: 'org1',
        display_name: 'Acme Corp',
        allowed_backends: ['b1'],
        incus_ui_enabled: true
      })
    ]
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('.base-modal-overlay').exists()).toBe(false)

    await findButtonByText(wrapper, 'Backends')!.trigger('click')
    await nextTick()

    expect(wrapper.find('.base-modal-overlay').exists()).toBe(true)
    // Modal titled with the target org.
    expect(wrapper.find('.base-modal-title').text()).toContain('Acme Corp')
    // The org's allowed backend is pre-checked.
    const b1Checkbox = wrapper
      .findAll('input[type="checkbox"]')
      .find((c: any) => (c.element as HTMLInputElement).value === 'b1')
    expect(b1Checkbox).toBeTruthy()
    expect((b1Checkbox!.element as HTMLInputElement).checked).toBe(true)
  })

  it('saves backend config via PATCH and the store update with the expected payloads', async () => {
    shared.backends = [
      { id: 'b1', name: 'Backend One', connected: true, is_default: false, is_active: true }
    ]
    shared.orgs = [
      makeOrg({
        id: 'org1',
        display_name: 'Acme Corp',
        allowed_backends: ['b1'],
        default_backend: '',
        incus_ui_enabled: true
      })
    ]
    const wrapper = mountPage()
    await flushPromises()

    await findButtonByText(wrapper, 'Backends')!.trigger('click')
    await nextTick()

    await wrapper.find('.base-modal-footer .btn-primary').trigger('click')
    await flushPromises()

    expect(mockedAxios.patch).toHaveBeenCalledWith('/organizations/org1', {
      incus_ui_enabled: true
    })
    expect(shared.updateOrganizationBackendConfig).toHaveBeenCalledWith('org1', {
      allowed_backends: ['b1'],
      default_backend: ''
    })
  })

  it('opens the plan modal for the clicked organization', async () => {
    shared.orgs = [makeOrg({ id: 'org1', display_name: 'Acme Corp' })]
    const wrapper = mountPage()
    await flushPromises()

    const stub = wrapper.find('.plan-modal-stub')
    expect(stub.attributes('data-visible')).toBe('false')

    await findButtonByText(wrapper, 'Plan')!.trigger('click')
    await nextTick()

    expect(stub.attributes('data-visible')).toBe('true')
    expect(stub.attributes('data-org-id')).toBe('org1')
    expect(stub.attributes('data-org-name')).toBe('Acme Corp')
  })
})
