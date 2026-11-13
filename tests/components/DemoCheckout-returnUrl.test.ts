/**
 * The demo checkout's outcome buttons follow `?success_url=` and
 * `?cancel_url=` only when they name a path inside the app; anything else
 * falls back to the subscription dashboard (success) or the plans page
 * (cancel and error).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const routeQuery: Record<string, any> = {}
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ push: vi.fn() }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

vi.mock('../../src/services/demo', () => ({
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn().mockResolvedValue(undefined)
}))

import DemoCheckout from '../../src/components/Demo/DemoCheckout.vue'

type Outcome = 'success' | 'cancel' | 'error'
const buttonFor: Record<Outcome, string> = {
  success: '.demo-actions .btn-success',
  cancel: '.demo-actions .btn-danger',
  error: '.demo-actions .btn-warning'
}

async function simulate(outcome: Outcome, query: { success_url?: string; cancel_url?: string }) {
  for (const key of Object.keys(routeQuery)) delete routeQuery[key]
  Object.assign(routeQuery, { session_id: 'demo-session', plan_name: 'Demo plan', amount: '1000', currency: 'eur' }, query)
  const wrapper = mount(DemoCheckout, { global: { plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })] } })
  await flushPromises()
  await wrapper.find(buttonFor[outcome]).trigger('click')
  await flushPromises()
}

const outsideDestinations = ['javascript:alert(1)', '//example.com', 'https://example.com']

describe('DemoCheckout — outcome destination', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.clearAllMocks()
    delete (window as any).location
    ;(window as any).location = { href: '', origin: 'http://localhost:4000' }
  })

  afterEach(() => {
    ;(window as any).location = originalLocation
  })

  it('follows the in-app path named by success_url', async () => {
    await simulate('success', { success_url: '/subscription-dashboard?session=ok' })
    expect(window.location.href).toBe('/subscription-dashboard?session=ok')
  })

  it('follows the in-app path named by cancel_url', async () => {
    await simulate('cancel', { cancel_url: '/subscription-plans?canceled=1' })
    expect(window.location.href).toBe('/subscription-plans?canceled=1')
  })

  it('adds the error flag to the in-app cancel_url path', async () => {
    await simulate('error', { cancel_url: '/subscription-plans?canceled=1' })
    expect(window.location.href).toBe('/subscription-plans?canceled=1&error=payment_failed')
  })

  it.each(outsideDestinations)('goes to the subscription dashboard when success_url is %j', async (url) => {
    await simulate('success', { success_url: url })
    expect(window.location.href).toBe('/subscription-dashboard')
  })

  it.each(outsideDestinations)('goes to the plans page when cancel_url is %j', async (url) => {
    await simulate('cancel', { cancel_url: url })
    expect(window.location.href).toBe('/subscription-plans')
  })

  it.each(outsideDestinations)('stays in the app with the error flag when cancel_url is %j', async (url) => {
    await simulate('error', { cancel_url: url })
    expect(window.location.href).toBe('/subscription-plans?error=payment_failed')
  })

  it('stays in the app with the error flag when cancel_url normalises to a leading double slash', async () => {
    await simulate('error', { cancel_url: '/.//example.com' })
    expect(window.location.href).toBe('/subscription-plans?error=payment_failed')
  })
})
