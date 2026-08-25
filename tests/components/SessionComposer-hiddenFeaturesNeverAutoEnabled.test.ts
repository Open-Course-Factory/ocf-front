/**
 * What a plain terminal sends to the backend when nobody asked for anything.
 *
 * `effects` is always_available, so it appears in `allowed_features` for every
 * distribution. The composer used to auto-enable every allowed feature except a
 * hardcoded `persistence`/`network` pair, so a plain session silently opted into
 * it — and tt-backend answers that request by running apt-get and pipx INSIDE
 * the container. On a session without network that install cannot succeed: it
 * spent ~25s timing out and then degraded the banner to plain text anyway, on
 * the critical path of every single start.
 *
 * The list of features a session must never opt into on its own already existed
 * as HIDDEN_FEATURE_KEYS; it was just being used for display only. These tests
 * pin the two paths that reach the backend to it.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const mockGetDistributions = vi.fn()
const mockGetSessionOptions = vi.fn()

vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    getDistributions: (...args: any[]) => mockGetDistributions(...args),
    getSessionOptions: (...args: any[]) => mockGetSessionOptions(...args),
    startComposedSession: vi.fn(),
    startSession: vi.fn(),
    stopSession: vi.fn(),
    deleteSession: vi.fn(),
  }
}))

import SessionComposer from '../../src/components/Terminal/SessionComposer.vue'

function createTestI18n() {
  return createI18n({
    legacy: false, locale: 'en', fallbackLocale: 'en',
    messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false,
  })
}

function mountComposer() {
  return mount(SessionComposer, {
    global: {
      plugins: [createTestI18n()],
      stubs: { 'router-link': { template: '<a><slot /></a>' } }
    }
  })
}

function size(key: string) {
  return {
    key, name: key.toUpperCase(), cpu: 1, cpu_allowance: '100%',
    memory: '1GiB', disk: '4GiB', processes: 100,
    sort_order: ['xs', 's', 'm'].indexOf(key),
    allowed: true, remaining_count: 1,
  }
}

const debian = {
  name: 'Debian', prefix: 'd', description: 'Debian 13',
  is_global: true, min_size_key: 'xs', default_size_key: 'xs',
}

/**
 * Production's catalog: `effects` and `network` are always offered and allowed,
 * alongside one ordinary feature that IS a learner's choice.
 */
function options() {
  return {
    distribution: debian,
    allowed_sizes: [size('xs'), size('s')],
    allowed_features: [
      { key: 'effects', name: 'Terminal Effects', description: 'tte', allowed: true },
      { key: 'network', name: 'Network Access', description: 'egress', allowed: true },
      { key: 'docker', name: 'Docker', description: 'docker', allowed: true },
    ],
    quota: {
      max_cpu: 4000, max_memory_mb: 8192, used_cpu: 0, used_memory_mb: 0,
      remaining_cpu: 4000, remaining_memory_mb: 8192, scope: 'user',
    },
  }
}

async function settle() {
  for (let i = 0; i < 6; i++) await flushPromises()
}

describe('SessionComposer — features a plain session must never opt into', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetDistributions.mockResolvedValue([debian])
    mockGetSessionOptions.mockResolvedValue(options())
  })

  it('does not auto-enable effects on a plain terminal', async () => {
    const wrapper = mountComposer()
    await settle()

    // The one real chip is on, because that is what auto-enabling is for.
    expect(wrapper.vm.enabledFeatures.docker).toBe(true)
    // The scenario engine's capability is not, so no apt-get runs in the
    // container for a banner nobody asked for.
    expect(wrapper.vm.enabledFeatures.effects).toBeFalsy()
    // And network stays opt-in, as its dedicated toggle owns it.
    expect(wrapper.vm.enabledFeatures.network).toBeFalsy()
  })

  it('drops effects from a config remembered before it was hidden', async () => {
    // A browser that used the old build carries this, and it would otherwise
    // keep charging every start the failed install.
    localStorage.setItem('ocf-last-session-config', JSON.stringify({
      distribution: 'Debian',
      size: 'xs',
      features: { effects: true, network: true, docker: true },
    }))

    const wrapper = mountComposer()
    await settle()

    expect(wrapper.vm.enabledFeatures.effects).toBeFalsy()
    expect(wrapper.vm.enabledFeatures.network).toBeFalsy()
    // The learner's own choice still survives the round trip.
    expect(wrapper.vm.enabledFeatures.docker).toBe(true)
  })
})
