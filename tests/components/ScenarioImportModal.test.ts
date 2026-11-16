/**
 * The scenario import dialog, for both file formats: a Labinux JSON export
 * and a KillerCoda archive.
 *
 * The two formats share the dialog — pick a file, import it into the class,
 * the organization or the platform, list the problems the server finds — and
 * differ in what they accept: the extensions, the size limit, and the JSON
 * file being read before it is sent so its title and step count can be shown.
 *
 * axios is the boundary: the destination is checked by the URL posted to.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { pickFile } from '../helpers/fileInput'
import { createI18n } from 'vue-i18n'
import { createTestI18n } from '../helpers/entityModalHelper'

const postMock = vi.fn()
vi.mock('axios', () => ({
  default: { post: (...args: any[]) => postMock(...args) },
}))

import ScenarioImportModal from '../../src/components/Modals/ScenarioImportModal.vue'

type Format = 'json' | 'archive'
const MB = 1024 * 1024

function mountModal(format: Format, scope: { groupId?: string; organizationId?: string } = {}): VueWrapper {
  return mount(ScenarioImportModal, {
    props: { visible: true, format, ...scope },
    global: { plugins: [createTestI18n()] },
  })
}

function fileOf(name: string, content = '', size?: number): File {
  const file = new File([content], name)
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size })
  return file
}

const LAB = { title: 'Lab', steps: [{ title: 'one' }, { title: 'two' }] }
const validFile = (format: Format) =>
  format === 'json' ? fileOf('lab.json', JSON.stringify(LAB)) : fileOf('lab.zip', 'PK')


const importButton = (wrapper: VueWrapper) => wrapper.find('.upload-footer .btn-primary')
const errorText = (wrapper: VueWrapper) => wrapper.find('.error-message').text()

async function importFile(wrapper: VueWrapper, file: File) {
  await pickFile(wrapper, file)
  await importButton(wrapper).trigger('click')
  await flushPromises()
}

describe('ScenarioImportModal — what each format accepts', () => {
  it.each([
    { format: 'json' as const, title: 'Import JSON Scenario', accept: '.json' },
    { format: 'archive' as const, title: 'Import KillerCoda Scenario', accept: '.zip,.tar.gz,.tgz' },
  ])('$format: titles the dialog and filters the file picker', ({ format, title, accept }) => {
    const wrapper = mountModal(format)
    expect(wrapper.find('.base-modal-header').text()).toContain(title)
    expect(wrapper.find('input[type="file"]').attributes('accept')).toBe(accept)
  })

  it.each([
    { format: 'json' as const, name: 'lab.json' },
    { format: 'json' as const, name: 'LAB.JSON' },
    { format: 'archive' as const, name: 'lab.zip' },
    { format: 'archive' as const, name: 'lab.tar.gz' },
    { format: 'archive' as const, name: 'LAB.TGZ' },
  ])('$format: accepts $name', async ({ format, name }) => {
    const wrapper = mountModal(format)
    await pickFile(wrapper, fileOf(name, JSON.stringify(LAB)))
    expect(wrapper.find('.error-message').exists()).toBe(false)
    expect(wrapper.find('.file-name').text()).toBe(name)
    expect(importButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it.each([
    { format: 'json' as const, name: 'lab.zip', says: 'Please select a .json file' },
    { format: 'archive' as const, name: 'lab.json', says: 'Please select a .zip, .tar.gz, or .tgz file' },
  ])('$format: refuses $name', async ({ format, name, says }) => {
    const wrapper = mountModal(format)
    await pickFile(wrapper, fileOf(name, JSON.stringify(LAB)))
    expect(errorText(wrapper)).toContain(says)
    expect(wrapper.find('.file-name').exists()).toBe(false)
    expect(importButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it.each([
    { format: 'json' as const, name: 'lab.zip', says: 'Please select a .json file' },
    { format: 'archive' as const, name: 'lab.json', says: 'Please select a .zip, .tar.gz, or .tgz file' },
  ])('$format: a refused $name replaces the file picked before it', async ({ format, name, says }) => {
    const wrapper = mountModal(format)
    await pickFile(wrapper, validFile(format))
    await pickFile(wrapper, fileOf(name, JSON.stringify(LAB)))
    expect(errorText(wrapper)).toContain(says)
    expect(wrapper.find('.file-name').exists()).toBe(false)
    expect(importButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it.each([
    { format: 'json' as const, name: 'lab.json', limit: 5 },
    { format: 'archive' as const, name: 'lab.zip', limit: 10 },
  ])('$format: refuses a file over $limit MB', async ({ format, name, limit }) => {
    const wrapper = mountModal(format)
    await pickFile(wrapper, fileOf(name, JSON.stringify(LAB), limit * MB + 1))
    expect(errorText(wrapper)).toContain(`${limit} MB`)
    expect(importButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('archive: takes a file the JSON limit would refuse', async () => {
    const wrapper = mountModal('archive')
    await pickFile(wrapper, fileOf('lab.zip', 'PK', 6 * MB))
    expect(wrapper.find('.error-message').exists()).toBe(false)
    expect(importButton(wrapper).attributes('disabled')).toBeUndefined()
  })
})

describe('ScenarioImportModal — the JSON file is read before it is sent', () => {
  it('json: shows the title and step count of the file', async () => {
    const wrapper = mountModal('json')
    await pickFile(wrapper, validFile('json'))
    expect(wrapper.find('.preview-info').text()).toContain('Scenario: Lab — 2 step(s)')
  })

  it.each([
    { content: '{not json', says: 'Invalid JSON file' },
    { content: JSON.stringify({ title: 'Lab' }), says: 'Missing required fields: title and steps' },
  ])('json: refuses $says before sending', async ({ content, says }) => {
    const wrapper = mountModal('json')
    await pickFile(wrapper, fileOf('lab.json', content))
    expect(errorText(wrapper)).toContain(says)
    expect(importButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('archive: has no preview, the server reads the archive', async () => {
    const wrapper = mountModal('archive')
    await pickFile(wrapper, validFile('archive'))
    expect(wrapper.find('.preview-info').exists()).toBe(false)
  })
})

describe('ScenarioImportModal — import', () => {
  beforeEach(() => {
    postMock.mockReset()
    postMock.mockResolvedValue({ data: { id: 'new-scenario' } })
  })

  it.each([
    { format: 'json' as const, scope: { groupId: 'g1' }, url: '/groups/g1/scenarios/import-json' },
    { format: 'json' as const, scope: { organizationId: 'o1' }, url: '/organizations/o1/scenarios/import-json' },
    { format: 'json' as const, scope: {}, url: '/scenarios/import-json' },
    { format: 'archive' as const, scope: { groupId: 'g1' }, url: '/groups/g1/scenarios/upload' },
    { format: 'archive' as const, scope: { organizationId: 'o1' }, url: '/organizations/o1/scenarios/upload' },
    { format: 'archive' as const, scope: {}, url: '/scenarios/upload' },
  ])('$format into $scope posts to $url', async ({ format, scope, url }) => {
    const wrapper = mountModal(format, scope)
    const file = validFile(format)
    await importFile(wrapper, file)

    expect(postMock).toHaveBeenCalledTimes(1)
    const [postedUrl, body] = postMock.mock.calls[0]
    expect(postedUrl).toBe(url)
    if (format === 'json') expect(body).toEqual(LAB)
    else expect(((body as FormData).get('file') as File).name).toBe(file.name)
  })

  it.each(['json', 'archive'] as const)('%s: hands the created scenario over once the success step is closed', async (format) => {
    const wrapper = mountModal(format, { organizationId: 'o1' })
    await importFile(wrapper, validFile(format))

    expect(wrapper.text()).toContain('Scenario imported successfully!')
    expect(wrapper.emitted('imported')).toBeUndefined()
    await wrapper.find('.upload-success .btn-primary').trigger('click')
    expect(wrapper.emitted('imported')).toEqual([[{ id: 'new-scenario' }]])
  })

  // ocf-core answers content it cannot play with a 400 listing every problem,
  // for an archive as for JSON (respondImportError).
  it.each(['json', 'archive'] as const)('%s: lists every problem the server finds', async (format) => {
    postMock.mockRejectedValue({
      response: {
        status: 400,
        data: {
          error_message: 'The scenario has 2 problem(s) to fix before it can be imported',
          details: ['step 1: verify script is empty', 'step 2: title is missing'],
        },
      },
    })
    const wrapper = mountModal(format, { groupId: 'g1' })
    await importFile(wrapper, validFile(format))

    const problems = wrapper.find('[data-testid="scenario-import-problems"]')
    expect(problems.text()).toContain('The scenario has 2 problem(s) to fix')
    expect(problems.findAll('li').map(li => li.text())).toEqual([
      'step 1: verify script is empty',
      'step 2: title is missing',
    ])
    expect(wrapper.emitted('imported')).toBeUndefined()
  })

  it.each(['json', 'archive'] as const)('%s: says what the server said when it lists no problems', async (format) => {
    postMock.mockRejectedValue({ response: { status: 403, data: { error_message: 'You may not replace it' } } })
    const wrapper = mountModal(format, { organizationId: 'o1' })
    await importFile(wrapper, validFile(format))

    expect(wrapper.find('[data-testid="scenario-import-problems"]').exists()).toBe(false)
    expect(errorText(wrapper)).toContain('You may not replace it')
  })
})

describe('ScenarioImportModal — closing', () => {
  it.each(['json', 'archive'] as const)('%s: Cancel emits close and the next opening starts empty', async (format) => {
    const wrapper = mountModal(format)
    await pickFile(wrapper, validFile(format))
    expect(wrapper.find('.file-name').exists()).toBe(true)

    await wrapper.find('.upload-footer .btn-secondary').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)

    await wrapper.setProps({ visible: false })
    await wrapper.setProps({ visible: true })
    expect(wrapper.find('.file-name').exists()).toBe(false)
    expect(wrapper.find('.error-message').exists()).toBe(false)
    expect(wrapper.find('.preview-info').exists()).toBe(false)
  })

  it.each(['json', 'archive'] as const)('%s: closing the success step with the X still hands the scenario over', async (format) => {
    postMock.mockReset()
    postMock.mockResolvedValue({ data: { id: 'new-scenario' } })
    const wrapper = mountModal(format)
    await importFile(wrapper, validFile(format))

    await wrapper.find('.base-modal-close').trigger('click')
    expect(wrapper.emitted('imported')).toEqual([[{ id: 'new-scenario' }]])
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it.each(['json', 'archive'] as const)('%s: clearing the refused file clears its problems too', async (format) => {
    postMock.mockReset()
    postMock.mockRejectedValue({ response: { status: 400, data: { error_message: 'Refused', details: ['step 1: bad'] } } })
    const wrapper = mountModal(format)
    await importFile(wrapper, validFile(format))
    expect(wrapper.find('[data-testid="scenario-import-problems"]').exists()).toBe(true)

    await wrapper.find('.btn-clear').trigger('click')
    expect(wrapper.find('.file-name').exists()).toBe(false)
    expect(wrapper.find('[data-testid="scenario-import-problems"]').exists()).toBe(false)
    expect(wrapper.find('.error-message').exists()).toBe(false)
    expect(importButton(wrapper).attributes('disabled')).toBeDefined()
  })
})

// A key missing in one language renders as the key itself: walk every screen
// of the dialog in each language, with no fallback to hide a gap.
describe('ScenarioImportModal — both languages', () => {
  it.each([
    { locale: 'en', format: 'json' as const, title: 'Import JSON Scenario' },
    { locale: 'en', format: 'archive' as const, title: 'Import KillerCoda Scenario' },
    { locale: 'fr', format: 'json' as const, title: 'Importer un scénario JSON' },
    { locale: 'fr', format: 'archive' as const, title: 'Importer un scénario KillerCoda' },
  ])('$locale $format: every screen is translated', async ({ locale, format, title }) => {
    const i18n = createI18n({
      legacy: false, locale, fallbackLocale: false as any,
      messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false,
    })
    const wrapper = mount(ScenarioImportModal, {
      props: { visible: true, format },
      global: { plugins: [i18n] },
    })
    const screens: string[] = [wrapper.html()]
    expect(wrapper.find('.base-modal-header').text()).toContain(title)

    await pickFile(wrapper, fileOf(format === 'json' ? 'lab.zip' : 'lab.json', 'x'))
    screens.push(wrapper.html())
    await pickFile(wrapper, validFile(format))
    await pickFile(wrapper, fileOf(format === 'json' ? 'lab.json' : 'lab.zip', 'x', 11 * MB))
    screens.push(wrapper.html())
    if (format === 'json') {
      await pickFile(wrapper, fileOf('lab.json', '{not json'))
      screens.push(wrapper.html())
      await pickFile(wrapper, fileOf('lab.json', JSON.stringify({ title: 'Lab' })))
      screens.push(wrapper.html())
    }
    await pickFile(wrapper, validFile(format))
    screens.push(wrapper.html())

    postMock.mockReset()
    postMock.mockRejectedValueOnce(new Error('network down'))
    await importButton(wrapper).trigger('click')
    await flushPromises()
    screens.push(wrapper.html())

    let finish: (v: unknown) => void = () => {}
    postMock.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    await importButton(wrapper).trigger('click')
    screens.push(wrapper.html())
    finish({ data: { id: 'new-scenario' } })
    await flushPromises()
    screens.push(wrapper.html())

    expect(screens.length).toBeGreaterThanOrEqual(6)
    for (const screen of screens) expect(screen).not.toMatch(/scenarioImportModal\./)
  })
})
