/**
 * An org manager who opens the subscription dashboard directly (hard reload,
 * bookmark) gets the org usage panel. The dashboard and the panel ask
 * permissions.canManageOrganization, which answers from the memberships loaded
 * at startup — nothing on this page loads another snapshot (#394). On a cold
 * load the page can render before those memberships arrive: the panel must
 * then appear when they do, not stay hidden.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn()
}))

vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: { getOrgTerminalUsage: vi.fn().mockResolvedValue(null) }
}))

// The real store drags the router in; the role checks only read the platform roles.
vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: () => ({ userRoles: ['member'] })
}))

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({ currentOrganization: { id: 'org-1' } })
}))

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({
    currentSubscription: null,
    allSubscriptions: [],
    hasActiveSubscription: () => false,
    getCurrentSubscription: vi.fn().mockResolvedValue(null)
  })
}))

import i18n from '../../src/i18n'
import SubscriptionDashboard from '../../src/components/Pages/SubscriptionDashboard.vue'
import { useUserMembershipsStore } from '../../src/stores/userMemberships'

const stubs = {
  UpgradeToTeamBanner: true,
  ErrorAlert: true,
  ActiveSubscriptionSource: true,
  NoSubscriptionCard: true,
  AllSubscriptions: true,
  TerminalUsagePanel: true,
  RecentInvoices: true,
  CancelSubscriptionModal: true,
  ReactivateModal: true
}

describe('SubscriptionDashboard — org usage panel for an org manager', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows the panel once the startup memberships say the user manages the org', async () => {
    // Cold load: the boot-time membership request has not answered yet.
    const memberships = useUserMembershipsStore()
    const wrapper = mount(SubscriptionDashboard, { global: { plugins: [i18n], stubs } })
    await flushPromises()
    expect(wrapper.find('.collapsible-section').exists()).toBe(false)

    memberships.orgMemberships = [{ organization_id: 'org-1', role: 'manager' }]
    memberships.isLoaded = true
    await flushPromises()

    expect(wrapper.find('.collapsible-section').exists()).toBe(true)
  })
})
