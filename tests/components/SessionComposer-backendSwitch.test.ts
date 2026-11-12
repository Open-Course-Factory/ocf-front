/**
 * Switching servers must show that server's distributions.
 *
 * The starter used to ask the composer to reload from a watcher of its own,
 * which Vue runs before the composer receives the new `backendId` prop — so
 * every switch loaded the list of the server selected before. Picking server A
 * then server B showed A's dedicated distribution under B, and choosing it
 * asked B for its options, got "not found", and left Internet locked.
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

const debian = { name: 'Debian', prefix: 'd', description: 'Debian 13', is_global: true, min_size_key: 'xs', default_size_key: 'xs' }
const dedicated = { name: 'Dedicated', prefix: 'ded', description: 'Only on server A', is_global: false, min_size_key: 'xs', default_size_key: 'xs' }

const catalogue: Record<string, any[]> = {
  'server-a': [debian, dedicated],
  'server-b': [debian],
}

function options(dist: any) {
  return {
    distribution: dist,
    allowed_sizes: [{
      key: 'xs', name: 'XS', cpu: 1, cpu_allowance: '100%', memory: '1GiB', disk: '4GiB',
      processes: 100, sort_order: 0, allowed: true, remaining_count: 1,
    }],
    allowed_features: [{ key: 'network', name: 'Network', description: '', allowed: true }],
  }
}

async function settle() {
  for (let i = 0; i < 6; i++) await flushPromises()
}

function mountComposer(backendId: string) {
  return mount(SessionComposer, {
    props: { backendId },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: { 'router-link': { template: '<a><slot /></a>' } },
    },
  })
}

describe('SessionComposer — switching servers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockGetDistributions.mockImplementation((backend: string) => Promise.resolve(catalogue[backend] ?? []))
    mockGetSessionOptions.mockImplementation((name: string) =>
      Promise.resolve(options([debian, dedicated].find(d => d.name === name))))
  })

  it('lists the new server’s distributions as soon as the server changes', async () => {
    const wrapper = mountComposer('server-a')
    await settle()
    expect(wrapper.text()).toContain('Dedicated')

    await wrapper.setProps({ backendId: 'server-b' })
    await settle()

    expect(mockGetDistributions).toHaveBeenLastCalledWith('server-b')
    expect(wrapper.text()).not.toContain('Dedicated')
  })

  it('drops a selected distribution the new server does not offer', async () => {
    const wrapper = mountComposer('server-a')
    await settle()
    await wrapper.findAll('.distribution-card').find(c => c.text().includes('Dedicated'))!.trigger('click')
    await settle()

    await wrapper.setProps({ backendId: 'server-b' })
    await settle()

    expect((wrapper.vm as any).selectedDistribution?.name).toBe('Debian')
    expect((wrapper.vm as any).networkAllowed).toBe(true)
  })

  it('ignores a list that arrives after a newer server was picked', async () => {
    let releaseServerA!: () => void
    mockGetDistributions.mockImplementation((backend: string) => backend === 'server-a'
      ? new Promise(resolve => { releaseServerA = () => resolve(catalogue['server-a']) })
      : Promise.resolve(catalogue[backend]))

    const wrapper = mountComposer('server-a')
    await wrapper.setProps({ backendId: 'server-b' })
    await settle()
    releaseServerA()
    await settle()

    expect(wrapper.text()).not.toContain('Dedicated')
  })
})
