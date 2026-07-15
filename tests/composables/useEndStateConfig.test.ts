/**
 * Tests for useEndStateConfig — the shared end-of-session banner config used
 * by TerminalViewer (overlay) and TerminalSessionView (banner).
 *
 * Issue #272 / ocf-core #388: the backend now emits a distinct state='revoked'
 * when a session is terminated for billing / entitlement reasons (plan lapse,
 * license revocation). Today the frontend funnels this into the
 * "Session Expired — you reached your time limit" copy, which is dishonest and
 * high-stakes when it happens mid-exam. The fix adds a `revoked` reason with
 * HONEST, ACTIONABLE copy pointing the learner at their subscription/trainer.
 *
 * These tests pin the honest-copy contract for `revoked` (RED today — the
 * `revoked` reason does not exist, so getEndStateConfig('revoked') throws) and
 * guard that `expired` still shows the time-limit copy (green regression fence).
 */

import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import {
  useEndStateConfig,
  type EndStateReason
} from '../../src/composables/useEndStateConfig'

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

/**
 * Run the composable inside a fake setup() so it can access useI18n(), then
 * return getEndStateConfig for the given reason in the given locale.
 */
function getConfig(
  reason: EndStateReason,
  locale: 'en' | 'fr' = 'en',
  options?: { hasScenario?: boolean }
) {
  let captured!: ReturnType<ReturnType<typeof useEndStateConfig>['getEndStateConfig']>
  const Dummy = defineComponent({
    setup() {
      const { getEndStateConfig } = useEndStateConfig()
      captured = getEndStateConfig(reason, options)
      return () => h('div')
    }
  })
  mount(Dummy, { global: { plugins: [createTestI18n(locale)] } })
  return captured
}

describe('useEndStateConfig — revoked (billing/entitlement stop)', () => {
  it('English: honest title/body — subscription or license no longer active, NOT a time limit', () => {
    const config = getConfig('revoked' as EndStateReason, 'en')

    expect(config.title).toBe('Session ended')
    expect(config.body).toBe(
      'Your session was stopped because your subscription or license is no longer active. Contact your trainer or check your subscription to continue.'
    )

    // The dishonest failure mode is reusing the time-limit copy. Guard against it.
    expect(config.body).not.toContain('time limit')
    expect(config.title).not.toContain('Expired')
  })

  it('French: honest title/body — abonnement ou licence plus actif, PAS une limite de temps', () => {
    const config = getConfig('revoked' as EndStateReason, 'fr')

    expect(config.title).toBe('Session interrompue')
    expect(config.body).toBe(
      "Votre session a été arrêtée car votre abonnement ou votre licence n'est plus actif. Contactez votre formateur ou vérifiez votre abonnement pour continuer."
    )

    expect(config.body).not.toContain('limite de temps')
    expect(config.title).not.toContain('expirée')
  })

  it('offers an actionable primary CTA to the subscription page + secondary back to sessions', () => {
    const config = getConfig('revoked' as EndStateReason, 'en')

    expect(config.primaryRoute).toEqual({ name: 'SubscriptionPlans' })
    expect(config.secondaryRoute).toEqual({ name: 'TerminalSessions' })
    // A revocation is not a success — the tone must not read as celebratory.
    expect(config.tone).not.toBe('success')
  })
})

describe('useEndStateConfig — disconnected (live-session reconnect)', () => {
  it('English: honest copy — connection lost, environment still running', () => {
    const config = getConfig('disconnected' as EndStateReason, 'en')

    expect(config.title).toBe('Terminal Disconnected')
    expect(config.body).toContain('still running')
    // A disconnect is recoverable — it must NOT read as a terminal end.
    expect(config.body).not.toContain('has ended')
    expect(config.title).not.toContain('Expired')
  })

  it('French: honest copy — connexion perdue, environnement toujours actif', () => {
    const config = getConfig('disconnected' as EndStateReason, 'fr')

    expect(config.title).toBe('Terminal déconnecté')
    expect(config.body).toContain('toujours actif')
  })

  it('primary button is a Reconnect ACTION (not a route navigation)', () => {
    const config = getConfig('disconnected' as EndStateReason, 'en')

    expect(config.primaryActionKey).toBe('reconnect')
    expect(config.primaryLabel).toBe('Reconnect')
    // tone must not read as celebratory — this is an interruption.
    expect(config.tone).not.toBe('success')
  })

  it('offers a secondary route back to the sessions list', () => {
    const config = getConfig('disconnected' as EndStateReason, 'en')

    expect(config.secondaryRoute).toEqual({ name: 'TerminalSessions' })
  })
})

describe('useEndStateConfig — expired guard (regression fence)', () => {
  it('English: expired still shows the time-limit copy (unchanged)', () => {
    const config = getConfig('expired', 'en')
    expect(config.title).toBe('Session Expired')
    expect(config.body).toContain('time limit')
  })

  it('French: expired still shows the time-limit copy (unchanged)', () => {
    const config = getConfig('expired', 'fr')
    expect(config.title).toBe('Session expirée')
    expect(config.body).toContain('limite de temps')
  })
})
