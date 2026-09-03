/**
 * Tests for the archive controls in OrganizationScenariosTab.
 *
 * Archiving retires a scenario whose class results must stay readable: the
 * backend keeps the row and stamps archived_at, then refuses to offer, assign
 * or launch it. The library is the one place archived scenarios must remain
 * visible — that is where they get restored from — so the tab hides them
 * behind a toggle rather than dropping them, and labels them when shown.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const orgListScenariosMock = vi.fn()
const archiveScenarioMock = vi.fn()
const unarchiveScenarioMock = vi.fn()

vi.mock('../../src/services/domain/scenario', () => ({
  teacherService: {
    orgListScenarios: (...args: unknown[]) => orgListScenariosMock(...args),
    orgDeleteScenario: vi.fn(),
    orgExportScenarioJSON: vi.fn(),
    orgExportScenarioArchive: vi.fn()
  }
}))

// Archiving goes through the generic store action (framework routes), not a
// scenario-specific service call.
vi.mock('../../src/stores/scenarios', () => ({
  useScenariosStore: () => ({
    archiveEntity: (...args: unknown[]) => archiveScenarioMock(...args),
    unarchiveEntity: (...args: unknown[]) => unarchiveScenarioMock(...args)
  })
}))

vi.mock('../../src/composables/useAdminViewMode', () => ({
  useAdminViewMode: () => ({ isAdmin: { value: false } })
}))

import OrganizationScenariosTab from '../../src/components/Organizations/OrganizationScenariosTab.vue'

const activeScenario = {
  id: 'sc-active',
  name: 'docker-basics',
  title: 'Docker Basics',
  difficulty: 'beginner',
  archived_at: null
}

const archivedScenario = {
  id: 'sc-archived',
  name: 'old-lab',
  title: 'Old Lab',
  difficulty: 'beginner',
  archived_at: '2026-01-15T10:00:00Z'
}

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

async function mountTab(): Promise<VueWrapper> {
  const wrapper = mount(OrganizationScenariosTab, {
    props: { organizationId: 'org-1', canManage: true },
    global: { plugins: [createTestI18n()] }
  })
  await flushPromises()
  return wrapper
}

function cardTitles(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.scenario-title').map(el => el.text())
}

describe('OrganizationScenariosTab — archived scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    orgListScenariosMock.mockResolvedValue([activeScenario, archivedScenario])
  })

  it('hides archived scenarios until the toggle is ticked', async () => {
    const wrapper = await mountTab()

    expect(cardTitles(wrapper).join(' ')).toContain('Docker Basics')
    expect(cardTitles(wrapper).join(' ')).not.toContain('Old Lab')

    await wrapper.find('.ocf-archived-toggle input').setValue(true)

    expect(cardTitles(wrapper).join(' ')).toContain('Old Lab')
  })

  it('labels an archived scenario so it is not mistaken for an active one', async () => {
    const wrapper = await mountTab()
    await wrapper.find('.ocf-archived-toggle input').setValue(true)

    expect(wrapper.find('.ocf-archived-badge').exists()).toBe(true)
  })

  it('keeps the toggle in place when nothing is archived, so the list never shifts', async () => {
    orgListScenariosMock.mockResolvedValue([activeScenario])
    const wrapper = await mountTab()

    expect(wrapper.find('.ocf-archived-toggle').exists()).toBe(true)
  })

  it('archives through the store action and reloads the library', async () => {
    const wrapper = await mountTab()

    const archiveButton = wrapper.findAll('.scenario-actions button')
      .find(b => b.find('.fa-box-archive').exists())
    expect(archiveButton, 'the active scenario offers an archive action').toBeTruthy()
    await archiveButton!.trigger('click')

    // The action is behind a confirmation — archiving retires a scenario for
    // the whole org.
    expect(archiveScenarioMock).not.toHaveBeenCalled()
    // The tab hosts a delete modal too — confirm the one that is open.
    const openModal = wrapper.findAllComponents({ name: 'BaseModal' })
      .find(m => m.props('visible') === true)
    expect(openModal, 'the archive confirmation is open').toBeTruthy()
    await openModal!.vm.$emit('confirm')
    await flushPromises()

    expect(archiveScenarioMock).toHaveBeenCalledWith('/scenarios', 'sc-active')
    expect(orgListScenariosMock).toHaveBeenCalledTimes(2)
  })

  it('restores an archived scenario without a confirmation step', async () => {
    const wrapper = await mountTab()
    await wrapper.find('.ocf-archived-toggle input').setValue(true)

    const restoreButton = wrapper.findAll('.scenario-actions button')
      .find(b => b.find('.fa-rotate-left').exists())
    expect(restoreButton, 'the archived scenario offers a restore action').toBeTruthy()
    await restoreButton!.trigger('click')
    await flushPromises()

    expect(unarchiveScenarioMock).toHaveBeenCalledWith('/scenarios', 'sc-archived')
  })
})
