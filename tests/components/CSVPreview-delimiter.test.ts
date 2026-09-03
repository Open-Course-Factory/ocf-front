/**
 * The CSV preview and the file upload must read a French export as columns.
 *
 * A semicolon-separated classroom export used to preview as ONE column holding
 * the whole header, which told the user nothing about what the import would
 * see. Both components now split with the detected delimiter and say so in a
 * hint that keeps its place whether or not it has text, so a detected
 * delimiter never shifts the rest of the panel.
 */

import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import CSVPreview from '../../src/components/BulkImport/CSVPreview.vue'
import CSVFileUpload from '../../src/components/BulkImport/CSVFileUpload.vue'

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

const frenchExport =
  'Nom;Né(e) le;Sexe;E-mail;Heures manquées;Entrée;Sortie\n' +
  'DUPONT Marie;01/02/2008;F;marie@x.fr;0;;\n'

const commaExport = 'email,name\nmarie@x.fr,DUPONT Marie\n'

function csvFile(content: string): File {
  return new File([content], 'classe.csv', { type: 'text/csv' })
}

async function mountPreview(file: File, locale: 'en' | 'fr' = 'en') {
  const wrapper = mount(CSVPreview, {
    props: { visible: true, file, title: 'Users' },
    global: {
      plugins: [createTestI18n(locale)],
      stubs: { Teleport: true },
    },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

describe('CSVPreview with a semicolon-separated export', () => {
  it('shows one column per field of the header', async () => {
    const wrapper = await mountPreview(csvFile(frenchExport))

    const headers = wrapper.findAll('thead th').map(th => th.text())
    expect(headers).toEqual(['Nom', 'Né(e) le', 'Sexe', 'E-mail', 'Heures manquées', 'Entrée', 'Sortie'])
    expect(wrapper.findAll('tbody td')).toHaveLength(7)
  })

  it('tells the user the file is semicolon-separated', async () => {
    const wrapper = await mountPreview(csvFile(frenchExport))

    expect(wrapper.find('.ocf-csv-delimiter-hint').text()).toBe('Semicolon-separated file detected')
  })

  it('says it in French for a French reader', async () => {
    const wrapper = await mountPreview(csvFile(frenchExport), 'fr')

    expect(wrapper.find('.ocf-csv-delimiter-hint').text()).toBe('Fichier séparé par des points-virgules détecté')
  })

  it('keeps the hint slot in the layout, empty, for a comma-separated file', async () => {
    const wrapper = await mountPreview(csvFile(commaExport))

    const hint = wrapper.find('.ocf-csv-delimiter-hint')
    expect(hint.exists()).toBe(true)
    expect(hint.text()).toBe('')
    expect(wrapper.findAll('thead th')).toHaveLength(2)
  })

  it('renders a real Excel export with the same column count for header and rows', async () => {
    const excelExport =
      '\uFEFFname;Né(e) le;Sexe;email;Heures manquées;;Entrée;Sortie;\r\n' +
      'FAKENAME Alix;01/02/2008;F;alix.fakename@example.invalid;0;;01/09/2025;;\r\n' +
      'TESTNOM Camille;15/06/2008;M;camille.testnom@example.invalid;2;;01/09/2025;;\r\n'
    const wrapper = await mountPreview(csvFile(excelExport))

    const headers = wrapper.findAll('thead th').map(th => th.text())
    expect(headers[0]).toBe('name')
    expect(headers).toHaveLength(9)
    for (const row of wrapper.findAll('tbody tr')) {
      expect(row.findAll('td')).toHaveLength(9)
    }
    expect(wrapper.find('.ocf-csv-delimiter-hint').text()).toBe('Semicolon-separated file detected')
  })

  it('previews a header-only file as its columns and no rows', async () => {
    const wrapper = await mountPreview(csvFile('Nom;E-mail\n'))

    expect(wrapper.findAll('thead th')).toHaveLength(2)
    expect(wrapper.findAll('tbody tr')).toHaveLength(0)
    expect(wrapper.find('.error-message').exists()).toBe(false)
  })
})

describe('CSVFileUpload with a semicolon-separated export', () => {
  async function mountUpload(file: File | null) {
    const wrapper = mount(CSVFileUpload, {
      props: { modelValue: file, label: 'Users' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()
    return wrapper
  }

  it('names the detected delimiter next to the row count', async () => {
    const wrapper = await mountUpload(csvFile(frenchExport))

    expect(wrapper.find('.ocf-csv-delimiter-hint').text()).toBe('Semicolon-separated file detected')
    expect(wrapper.find('.file-stats').text()).toContain('1')
  })

  it('keeps the hint slot, empty, for a comma-separated file', async () => {
    const wrapper = await mountUpload(csvFile(commaExport))

    const hint = wrapper.find('.ocf-csv-delimiter-hint')
    expect(hint.exists()).toBe(true)
    expect(hint.text()).toBe('')
  })
})
