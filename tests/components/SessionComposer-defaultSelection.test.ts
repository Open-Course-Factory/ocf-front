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

/**
 * A size as the backend really reports it.
 *
 * This fixture used to model a plan limit as `allowed: false`, which is not
 * what ocf-core sends and is why the restore path's bug survived a green test.
 * ComputeSessionOptions marks EVERY size at or above the distribution's
 * minimum `allowed: true` and drops the ones below it; the plan budget appears
 * only as `remaining_count`, stamped later by EnrichSessionOptionsBudget,
 * which never touches `allowed`.
 */
function size(key: string, remainingCount: number) {
  const order = ['xs', 's', 'm', 'l', 'xl'].indexOf(key)
  return {
    key, name: key.toUpperCase(), cpu: 1, cpu_allowance: '100%',
    memory: '1GiB', disk: '4GiB', processes: 100, sort_order: order,
    allowed: true,
    remaining_count: remainingCount,
  }
}

const alpine = { name: 'Alpine', prefix: 'a', description: 'Alpine', is_global: true, min_size_key: 'xs', default_size_key: 'xs' }
const debian = { name: 'Debian', prefix: 'd', description: 'Debian 13', is_global: true, min_size_key: 'xs', default_size_key: 's' }
const ubuntu = { name: 'Ubuntu', prefix: 'u', description: 'Ubuntu 22.04', is_global: true, min_size_key: 's', default_size_key: 's' }

/**
 * The free plan, as production has it: a 500 mCPU / 256 MB budget, which buys
 * exactly one XS machine and nothing larger.
 *
 * So XS has one left and every bigger size has none — and a distribution whose
 * floor is S (Ubuntu) offers no size that can start at all, while still
 * reporting each of them `allowed: true`.
 */
function freePlanOptions(dist: any) {
  const floor = dist.min_size_key ?? 'xs'
  const sizes = ['xs', 's', 'm']
    .filter(key => ['xs', 's', 'm'].indexOf(key) >= ['xs', 's', 'm'].indexOf(floor))
    .map(key => size(key, key === 'xs' ? 1 : 0))

  return {
    distribution: dist,
    allowed_sizes: sizes,
    allowed_features: [
      { key: 'effects', name: 'Terminal Effects', description: 'tte', allowed: true },
    ],
    quota: {
      max_cpu: 500, max_memory_mb: 256, used_cpu: 0, used_memory_mb: 0,
      remaining_cpu: 500, remaining_memory_mb: 256, scope: 'user',
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

  it('prefers Debian whatever case the catalogue spells it in', async () => {
    // Production capitalises these; other deployments do not. A case-sensitive
    // preference does not fail loudly — it silently stops preferring anything
    // and falls through to display order, which is how a local run landed on
    // `alpine-xs` instead of Debian.
    const lower = { name: 'debian', prefix: 'd', description: 'Debian 13', is_global: true, min_size_key: 'xs', default_size_key: 's' }
    const other = { name: 'zz-other', prefix: 'z', description: 'Something else', is_global: true, min_size_key: 'xs', default_size_key: 'xs' }
    mockGetDistributions.mockResolvedValue([other, lower])
    mockGetSessionOptions.mockImplementation((name: string) =>
      Promise.resolve(freePlanOptions(name === 'debian' ? lower : other)))

    const wrapper = mountComposer()
    await settle()

    expect(wrapper.find('.distribution-card.selected').text()).toContain('debian')
  })
})