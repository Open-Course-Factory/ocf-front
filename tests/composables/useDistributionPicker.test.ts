/**
 * Tests for useDistributionPicker — the distribution-picker state/logic
 * extracted from GroupScenariosTab.vue (commit c3 of #244).
 *
 * The composable owns the distribution list, the selected prefix, the loading
 * flag, and the loader. The bulk-start MODAL (presentational) and the
 * confirmBulkStart service call stay in the parent.
 *
 * Source behavior pinned (parent lines 494–509, 1169–1172):
 *   - loadDistributions(): loadingDistributions=true; getDistributions(backendId);
 *     set distributions; auto-select ONLY when exactly one distribution
 *     (selectedDistribution = distributions[0].prefix); on error, log + keep
 *     state (no throw); loadingDistributions=false in finally.
 *   - a watch on backendsStore.selectedBackendId resets the selection and
 *     reloads. In the composable, loadDistributions accepts an optional
 *     backendId and the watch passes the new id.
 *
 * Harness: the composable uses a Pinia store + a watch, so it is run inside a
 * fake setup() (the established dummy-mount pattern from
 * useScenarioSession.test.ts), with a REAL pinia so the store's
 * selectedBackendId can be mutated to fire the watch. teacherService is mocked.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// ---- Mock the scenario service (controllable per test) ----
const mockGetDistributions = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    getDistributions: (...a: any[]) => mockGetDistributions(...a),
  },
}))

import { useDistributionPicker } from '../../src/composables/useDistributionPicker'
import { useTerminalBackendsStore } from '../../src/stores/terminalBackends'

type Picker = ReturnType<typeof useDistributionPicker>

function makeDist(prefix: string, name = prefix) {
  return { prefix, name, description: `${name} desc`, is_global: true }
}

/**
 * Run the composable inside a fake setup() so its lifecycle/watch run.
 * Returns both the composable and the live backends store.
 */
function setupPicker(): { picker: Picker; store: ReturnType<typeof useTerminalBackendsStore> } {
  let captured!: Picker
  const Dummy = defineComponent({
    setup() {
      captured = useDistributionPicker()
      return () => h('div')
    },
  })
  mount(Dummy)
  const store = useTerminalBackendsStore()
  return { picker: captured, store }
}

describe('useDistributionPicker', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadDistributions populates the list and toggles loading true→false', async () => {
    let resolveCall: (v: any) => void = () => {}
    mockGetDistributions.mockReturnValue(new Promise(r => { resolveCall = r }))

    const { picker } = setupPicker()
    expect(picker.loadingDistributions.value).toBe(false)

    const p = picker.loadDistributions()
    // Loading is true while the request is in flight.
    expect(picker.loadingDistributions.value).toBe(true)

    resolveCall([makeDist('ubuntu'), makeDist('debian')])
    await p
    await flushPromises()

    expect(picker.loadingDistributions.value).toBe(false)
    expect(picker.distributions.value.map((d: any) => d.prefix)).toEqual(['ubuntu', 'debian'])
  })

  it('auto-selects the only distribution when the response has exactly one', async () => {
    mockGetDistributions.mockResolvedValue([makeDist('ubuntu')])
    const { picker } = setupPicker()

    await picker.loadDistributions()
    await flushPromises()

    expect(picker.selectedDistribution.value).toBe('ubuntu')
  })

  it('does NOT auto-select when the response has multiple distributions', async () => {
    mockGetDistributions.mockResolvedValue([makeDist('ubuntu'), makeDist('debian'), makeDist('alpine')])
    const { picker } = setupPicker()

    await picker.loadDistributions()
    await flushPromises()

    expect(picker.selectedDistribution.value).toBe('')
  })

  it('keeps a safe empty state when getDistributions rejects', async () => {
    mockGetDistributions.mockRejectedValue(new Error('network down'))
    const { picker } = setupPicker()

    // Must not throw out of loadDistributions.
    await expect(picker.loadDistributions()).resolves.toBeUndefined()
    await flushPromises()

    expect(picker.loadingDistributions.value).toBe(false)
    expect(picker.distributions.value).toEqual([])
  })

  it('reloads distributions when the store selectedBackendId changes', async () => {
    // First load (no backend) → two distros.
    mockGetDistributions.mockResolvedValueOnce([makeDist('ubuntu'), makeDist('debian')])
    const { picker, store } = setupPicker()
    await picker.loadDistributions()
    await flushPromises()
    expect(picker.distributions.value.length).toBe(2)

    // Changing the backend triggers the watch → reload with a different result.
    mockGetDistributions.mockResolvedValueOnce([makeDist('fedora')])
    store.selectBackend('backend-2')
    await nextTick()
    await flushPromises()

    // Assert on the resulting state, not just the call.
    expect(picker.distributions.value.map((d: any) => d.prefix)).toEqual(['fedora'])
    // The reload was scoped to the newly selected backend id.
    expect(mockGetDistributions).toHaveBeenLastCalledWith('backend-2')
  })
})
