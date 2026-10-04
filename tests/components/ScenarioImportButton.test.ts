/**
 * The scenario import button sends the file to the endpoint of the
 * destination the user picked.
 *
 * A KillerCoda archive or a JSON file can land in an organization, in a class
 * (which also assigns it), or — for an admin — on the platform, and each has
 * its own endpoint. Picking a class and having the file land in the class's
 * organization unassigned, or the reverse, is the mistake this pins.
 *
 * The destinations come from useScenarioCreateScopes (the editor's create
 * scopes), stubbed here with one organization and one class; the modals and
 * the service are real, with axios at the boundary.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { computed } from 'vue'

const postMock = vi.fn()
vi.mock('axios', () => ({
  default: { post: (...args: any[]) => postMock(...args) },
}))

const ORG = { kind: 'org' as const, id: 'org-1', name: 'Labinux' }
const GROUP = { kind: 'group' as const, id: 'grp-1', name: 'Test Class' }
vi.mock('../../src/composables/useScenarioCreateScopes', () => ({
  useScenarioCreateScopes: () => ({
    orgScopes: computed(() => [{ id: ORG.id, name: ORG.name }]),
    groupScopes: computed(() => [{ id: GROUP.id, name: GROUP.name }]),
    platformScopeAvailable: computed(() => false),
    availableCreateScopes: computed(() => [ORG, GROUP]),
    parseScopeKey: (key: string) =>
      key === `org:${ORG.id}` ? ORG : key === `group:${GROUP.id}` ? GROUP : null,
    pickDefaultScopeKey: () => `org:${ORG.id}`,
    loadScopeSources: () => Promise.resolve([]),
  }),
}))

import ScenarioImportButton from '../../src/components/ScenarioEditor/ScenarioImportButton.vue'

function mountButton(): VueWrapper {
  return mount(ScenarioImportButton, {
    global: {
      plugins: [createI18n({
        legacy: false, locale: 'en', fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false,
      })],
    },
  })
}

/** Open the chooser, pick format and destination, and go on to the file step. */
async function choose(wrapper: VueWrapper, format: 'killercoda' | 'json', destination: string) {
  await wrapper.find('[data-testid="scenario-import-btn"]').trigger('click')
  await flushPromises()
  await wrapper.find(`[data-testid="scenario-import-format-${format}"]`).setValue(true)
  await wrapper.find('#import-destination').setValue(destination)
  await wrapper.find('.base-modal-footer .btn-primary').trigger('click')
  await flushPromises()
}

/** Hand a file to the visible file input, as picking one in the browser does. */
async function pickFile(wrapper: VueWrapper, file: File) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
}

async function clickImport(wrapper: VueWrapper) {
  const importButton = wrapper.findAll('.upload-footer .btn-primary').find(b => !b.attributes('disabled'))
  expect(importButton, 'the Import button is enabled once a file is chosen').toBeTruthy()
  await importButton!.trigger('click')
  await flushPromises()
}

const archive = () => new File(['PK'], 'lab.zip', { type: 'application/zip' })
const jsonFile = () => new File([JSON.stringify({ title: 'Lab', steps: [] })], 'lab.json', { type: 'application/json' })

describe('ScenarioImportButton — destination decides the endpoint', () => {
  beforeEach(() => {
    postMock.mockReset()
    postMock.mockResolvedValue({ data: { id: 'new-scenario' } })
  })

  it('uploads an archive into the chosen class', async () => {
    const wrapper = mountButton()
    await choose(wrapper, 'killercoda', `group:${GROUP.id}`)
    await pickFile(wrapper, archive())
    await clickImport(wrapper)

    expect(postMock).toHaveBeenCalledTimes(1)
    expect(postMock.mock.calls[0][0]).toBe(`/groups/${GROUP.id}/scenarios/upload`)
  })

  it('uploads an archive into the chosen organization', async () => {
    const wrapper = mountButton()
    await choose(wrapper, 'killercoda', `org:${ORG.id}`)
    await pickFile(wrapper, archive())
    await clickImport(wrapper)

    expect(postMock.mock.calls[0][0]).toBe(`/organizations/${ORG.id}/scenarios/upload`)
  })

  it('imports a JSON file into the chosen class', async () => {
    const wrapper = mountButton()
    await choose(wrapper, 'json', `group:${GROUP.id}`)
    await pickFile(wrapper, jsonFile())
    await clickImport(wrapper)

    expect(postMock.mock.calls[0][0]).toBe(`/groups/${GROUP.id}/scenarios/import-json`)
  })

  it('hands the created scenario to its parent once the user closes the success step', async () => {
    const wrapper = mountButton()
    await choose(wrapper, 'json', `org:${ORG.id}`)
    await pickFile(wrapper, jsonFile())
    await clickImport(wrapper)

    expect(postMock.mock.calls[0][0]).toBe(`/organizations/${ORG.id}/scenarios/import-json`)
    expect(wrapper.text()).toContain('Scenario imported successfully!')
    await wrapper.find('.upload-success .btn-primary').trigger('click')

    expect(wrapper.emitted('imported')).toEqual([[{ id: 'new-scenario' }]])
  })

  it('says a refused archive is too large when the proxy answers 413 without a body', async () => {
    postMock.mockRejectedValue({ response: { status: 413, data: '<html>413</html>' } })
    const wrapper = mountButton()
    await choose(wrapper, 'killercoda', `group:${GROUP.id}`)
    await pickFile(wrapper, archive())
    await clickImport(wrapper)

    // The server's limit, not the 10 MB the modal checks before sending.
    expect(wrapper.find('.error-message').text()).toContain('too large for the server')
    expect(wrapper.find('.error-message').text()).not.toContain('10 MB')
    expect(wrapper.emitted('imported')).toBeUndefined()
  })
})
