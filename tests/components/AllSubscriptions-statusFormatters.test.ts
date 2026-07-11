/**
 * Characterization pins for AllSubscriptions.vue status rendering.
 *
 * AllSubscriptions currently reimplements getStatusClass / getStatusIcon
 * locally (switch statements). The dedupe batch (#268, I7) delegates these to
 * the shared useStatusFormatters('subscription') composable.
 *
 * These pins capture the CURRENT rendered class + icon so the delegation can be
 * verified against real behavior. IMPORTANT — the local getStatusIcon DIVERGES
 * from the composable on three statuses (reported to the lead before pinning):
 *   trialing : local fa-gift        vs composable fa-flask
 *   canceled : local fa-times-circle vs composable fa-ban
 *   unpaid   : local fa-credit-card  vs composable fa-exclamation-circle
 * getStatusClass is identical for every status. The three divergent-icon
 * assertions below are marked and act as a tripwire: whoever does the
 * delegation must consciously update them to the chosen icon set.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../../src/components/Subscription/composables/useSubscriptionTranslations', () => ({
  useSubscriptionTranslations: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../../src/composables/useAdminViewMode', () => {
  const { ref } = require('vue')
  return {
    useAdminViewMode: () => ({
      isAdmin: ref(true),
    }),
  }
})

import AllSubscriptions from '../../src/components/Subscription/Dashboard/AllSubscriptions.vue'

async function mountExpanded(status: string) {
  const wrapper = mount(AllSubscriptions, {
    props: {
      subscriptions: [{ id: 's1', status, subscription_plan: { name: 'Plan A' } }],
      isLoading: false,
    },
    global: {
      stubs: {
        AdminBadge: { template: '<span class="admin-badge-stub" />' },
      },
    },
  })
  // Cards live behind the collapsed header — expand to render the status badge.
  await wrapper.find('.collapsible-header').trigger('click')
  return wrapper
}

describe('AllSubscriptions — status class (identical to shared composable, safe to delegate)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const classCases: Array<[string, string]> = [
    ['active', 'text-success'],
    ['trialing', 'text-info'],
    ['canceled', 'text-warning'],
    ['past_due', 'text-danger'],
    ['unpaid', 'text-danger'],
    ['incomplete', 'text-muted'],
    ['something-unknown', 'text-secondary'],
  ]

  it.each(classCases)('status "%s" → badge class "%s"', async (status, expectedClass) => {
    const wrapper = await mountExpanded(status)
    expect(wrapper.find('.status-badge').classes()).toContain(expectedClass)
  })
})

describe('AllSubscriptions — status icon (CURRENT local behavior)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // Non-divergent: local and composable agree — these must stay green.
  const stableIconCases: Array<[string, string]> = [
    ['active', 'fa-check-circle'],
    ['past_due', 'fa-exclamation-triangle'],
    ['incomplete', 'fa-hourglass-half'],
    ['something-unknown', 'fa-question-circle'],
  ]

  it.each(stableIconCases)('status "%s" → icon "%s"', async (status, expectedIcon) => {
    const wrapper = await mountExpanded(status)
    expect(wrapper.find('.status-badge i').classes()).toContain(expectedIcon)
  })

  // Divergent tripwire: delegating to useStatusFormatters('subscription') will
  // change these. Composable values in the comment; update on delegation.
  const divergentIconCases: Array<[string, string, string]> = [
    ['trialing', 'fa-gift', 'fa-flask'],
    ['canceled', 'fa-times-circle', 'fa-ban'],
    ['unpaid', 'fa-credit-card', 'fa-exclamation-circle'],
  ]

  it.each(divergentIconCases)(
    'status "%s" → CURRENT icon "%s" (composable would give "%s")',
    async (status, currentIcon) => {
      const wrapper = await mountExpanded(status)
      expect(wrapper.find('.status-badge i').classes()).toContain(currentIcon)
    }
  )
})
