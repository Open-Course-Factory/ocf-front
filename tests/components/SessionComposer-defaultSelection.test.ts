/**
 * What the composer offers before the user has chosen anything.
 *
 * Two things were wrong on a free-plan account. Nothing was selected on
 * arrival, and the obvious click was not always a valid one — Ubuntu needs S
 * at minimum while the free plan allows only XS, so picking it led to a screen
 * with every size locked and no hint that another image would have worked. And
 * the only chip in "Additional options" was `effects`, the terminal-effects
 * capability the scenario engine drives, which is not a choice a learner
 * starting a plain terminal should be asked to make.
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

function size(key: string, allowed: boolean, reason?: string) {
  return {
    key, name: key.toUpperCase(), cpu: 1, cpu_allowance: '100%',
    memory: '1GiB', disk: '4GiB', processes: 100, sort_order: 0,
    allowed, ...(reason !== undefined ? { reason } : {}),
  }
}

const alpine = { name: 'Alpine', prefix: 'a', description: 'Alpine', is_global: true, min_size_key: 'xs', default_size_key: 'xs' }
const debian = { name: 'Debian', prefix: 'd', description: 'Debian 13', is_global: true, min_size_key: 'xs', default_size_key: 's' }
const ubuntu = { name: 'Ubuntu', prefix: 'u', description: 'Ubuntu 22.04', is_global: true, min_size_key: 's', default_size_key: 's' }

/** A free plan: XS is the only size it may run. */
function freePlanOptions(dist: any) {
  const launchable = (dist.min_size_key ?? 'xs') === 'xs'
  return {
    distribution: dist,
    allowed_sizes: [
      size('xs', launchable, launchable ? undefined : 'plan'),
      size('s', false, 'plan'),
      size('m', false, 'plan'),
    ],
    allowed_features: [
      { key: 'effects', name: 'Terminal Effects', description: 'tte', allowed: true },
    ],
    quota: {
      max_cpu: 1, max_memory_mb: 1024, used_cpu: 0, used_memory_mb: 0,
      remaining_cpu: 1, remaining_memory_mb: 1024, scope: 'user',
    },
  }
}

async function settle() {
  for (let i = 0; i < 6; i++) await flushPromises()
}

describe('SessionComposer — what is offered before the user chooses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetSessionOptions.mockImplementation((name: string) => {
      const dist = [alpine, debian, ubuntu].find(d => d.name === name) ?? alpine
      return Promise.resolve(freePlanOptions(dist))
    })
  })

  it('lands on a distribution the plan can actually start', async () => {
    mockGetDistributions.mockResolvedValue([alpine, debian, ubuntu])

    const wrapper = mountComposer()
    await settle()

    // Debian leads the preference order and runs on XS, so it wins outright.
    expect(mockGetSessionOptions).toHaveBeenCalledWith('Debian', undefined, undefined)
    expect(wrapper.find('.distribution-card.selected').text()).toContain('Debian')
    // And a size is picked too, so "Create" is reachable without a single click.
    expect(wrapper.find('.size-pill.selected').text()).toContain('XS')
  })

  it('never settles on a distribution whose minimum size the plan forbids', async () => {
    // Ubuntu alone would be the only card on screen; it cannot run on XS.
    mockGetDistributions.mockResolvedValue([ubuntu, debian])

    const wrapper = mountComposer()
    await settle()

    const asked = mockGetSessionOptions.mock.calls.map(c => c[0])
    expect(asked[asked.length - 1]).toBe('Debian')
    expect(wrapper.find('.distribution-card.selected').text()).toContain('Debian')
    expect(wrapper.find('.size-pill.selected').exists()).toBe(true)
  })

  it('passes over a remembered distribution the current plan can no longer run', async () => {
    // The account used to be on a paid plan and picked Ubuntu; it is on the
    // free plan now, where Ubuntu cannot start at all.
    localStorage.setItem('ocf-last-session-config', JSON.stringify({
      distribution: 'Ubuntu', size: 's', features: {}
    }))
    mockGetDistributions.mockResolvedValue([alpine, debian, ubuntu])

    mountComposer()
    await settle()

    const asked = mockGetSessionOptions.mock.calls.map(c => c[0])
    expect(asked[0]).toBe('Ubuntu')          // the remembered choice is tried first
    expect(asked).toContain('Debian')        // and abandoned for one that runs
    expect(asked[asked.length - 1]).toBe('Debian')
  })

  it('does not offer terminal effects as a session option', async () => {
    mockGetDistributions.mockResolvedValue([debian])

    const wrapper = mountComposer()
    await settle()

    expect(wrapper.html()).not.toContain('Terminal Effects')
    expect(wrapper.findAll('.feature-chip').length).toBe(0)
  })
})
