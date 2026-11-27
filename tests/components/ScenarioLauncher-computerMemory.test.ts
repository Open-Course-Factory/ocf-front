/**
 * A lab that runs in the learner's browser takes its machine's memory out of
 * their computer: above 2 GiB its card says how much RAM the computer needs,
 * and a computer the browser says is smaller cannot start it.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useRoute: () => ({ query: {} }),
}))

const showErrorSpy = vi.fn()
const showConfirmSpy = vi.fn().mockResolvedValue(true)
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: showErrorSpy,
    showConfirm: showConfirmSpy,
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showMessage: vi.fn(),
    showAlert: vi.fn(),
    showPrompt: vi.fn(),
  })
}))

const launchScenarioMock = vi.fn()
const listScenariosMock = vi.fn()
const getMySessionsMock = vi.fn()
vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    listScenarios: (...args: any[]) => listScenariosMock(...args),
    getMyScenarioSessions: (...args: any[]) => getMySessionsMock(...args),
    launchScenario: (...args: any[]) => launchScenarioMock(...args),
    abandonSession: vi.fn().mockResolvedValue(undefined),
  },
  pollProvisioningStatus: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: {
    getSessionOptions: vi.fn().mockResolvedValue({ allowed_sizes: [] }),
    getSizes: vi.fn().mockResolvedValue([]),
  }
}))

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({ currentOrganization: null })
}))

vi.mock('../../src/stores/subscriptions', () => ({
  useSubscriptionsStore: () => ({ currentSubscription: null })
}))

// The catalogue's authoring controls (Import, the access rule behind them)
// pull in the router and the membership stores; a learner's view is tested here.
vi.mock('../../src/composables/useScenarioEditorAccess', async () => {
  const { ref } = await import('vue')
  return { useScenarioEditorAccess: () => ({ canAccessScenarioEditor: ref(false) }) }
})
vi.mock('../../src/components/ScenarioEditor/ScenarioImportButton.vue', () => ({
  default: { template: '<button />' }
}))

import ScenarioLauncher from '../../src/components/Pages/ScenarioLauncher.vue'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountLauncher() {
  return mount(ScenarioLauncher, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        AdminBadge: true,
        ScenarioProvisioningOverlay: true,
        'router-link': { props: ['to'], template: '<a><slot /></a>' },
      }
    }
  })
}

const BIG = { id: 'sc-big', name: 'big', title: 'Big lab', launchable: true, local_machine_memory_mib: 4096 }
const SMALL = { id: 'sc-small', name: 'small', title: 'Small lab', launchable: true, local_machine_memory_mib: 1024 }

function setDeviceMemory(gb: number | undefined) {
  Object.defineProperty(navigator, 'deviceMemory', { value: gb, configurable: true })
}

describe('ScenarioLauncher — the computer\'s memory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMySessionsMock.mockResolvedValue([])
  })

  it('says a 4 GiB lab needs 8 GB, and lets a big enough computer start it', async () => {
    setDeviceMemory(8)
    listScenariosMock.mockResolvedValue([BIG, SMALL])
    const wrapper = mountLauncher()
    await flushPromises()
    const badges = wrapper.findAll('[data-testid="scenario-ram-badge"]')
    expect(badges).toHaveLength(1)
    expect(badges[0].text()).toBe('8 GB of RAM')
    expect(wrapper.findAll('[data-testid="scenario-launch-btn"]')).toHaveLength(2)
  })

  it('refuses it on a computer the browser says is smaller, and says why', async () => {
    setDeviceMemory(4)
    listScenariosMock.mockResolvedValue([BIG, SMALL])
    const wrapper = mountLauncher()
    await flushPromises()
    expect(wrapper.findAll('[data-testid="scenario-launch-btn"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('needs a computer with at least 8 GB of RAM. Your computer has less.')
  })

  it('only warns when the browser does not say (Firefox, Safari)', async () => {
    setDeviceMemory(undefined)
    listScenariosMock.mockResolvedValue([BIG])
    const wrapper = mountLauncher()
    await flushPromises()
    expect(wrapper.find('[data-testid="scenario-ram-badge"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="scenario-launch-btn"]').exists()).toBe(true)
  })
})

describe('ScenarioLauncher — the browser\'s CPUs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    setDeviceMemory(undefined)
    getMySessionsMock.mockResolvedValue([])
  })

  it('points to Firefox on a lab in the browser when the page is not isolated (Safari)', async () => {
    vi.stubGlobal('crossOriginIsolated', false)
    listScenariosMock.mockResolvedValue([SMALL, { id: 'sc-incus', name: 'incus', title: 'Incus lab', launchable: true }])
    const wrapper = mountLauncher()
    await flushPromises()
    const badges = wrapper.findAll('[data-testid="scenario-one-cpu-badge"]')
    expect(badges).toHaveLength(1)
    expect(badges[0].text()).toBe('Faster in Firefox')
  })

  it('says nothing where the page is isolated', async () => {
    vi.stubGlobal('crossOriginIsolated', true)
    listScenariosMock.mockResolvedValue([SMALL])
    const wrapper = mountLauncher()
    await flushPromises()
    expect(wrapper.find('[data-testid="scenario-one-cpu-badge"]').exists()).toBe(false)
  })

  it('shows the size once, next to the memory badge', async () => {
    vi.stubGlobal('crossOriginIsolated', true)
    listScenariosMock.mockResolvedValue([{ ...SMALL, resolved_size: 'S', instance_type: 'S' }])
    const wrapper = mountLauncher()
    await flushPromises()
    expect(wrapper.findAll('.os-badge').filter(b => b.text() === 'S')).toHaveLength(1)
  })
})
