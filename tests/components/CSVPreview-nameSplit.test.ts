/**
 * The users-file preview lets the user decide, per row, where a single
 * `name` column is cut and which side is the last name, BEFORE the import
 * records every learner under the wrong name.
 *
 * The editor appears only for rows the backend would split itself (a name,
 * no first_name/last_name); a boundary click adjusts that row alone, and the
 * default order recomputes every row the user has not adjusted.
 */

import { describe, it, expect } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import CSVPreview from '../../src/components/BulkImport/CSVPreview.vue'
import { emptyNameSplitPlan, type NameSplitPlan } from '../../src/utils/csvNameSplit'

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

function csvFile(content: string): File {
  return new File([content], 'classe.csv', { type: 'text/csv' })
}

/** Mounts the preview as the page does: the plan round-trips through update:nameSplit; `null` = no plan. */
async function mountPreview(file: File, nameSplit: NameSplitPlan | null = emptyNameSplitPlan(), locale: 'en' | 'fr' = 'en') {
  const wrapper = mount(CSVPreview, {
    props: {
      visible: true,
      file,
      title: 'Users',
      nameSplit: nameSplit ?? undefined,
      'onUpdate:nameSplit': (plan: NameSplitPlan) => wrapper.setProps({ nameSplit: plan }),
    },
    global: {
      plugins: [createTestI18n(locale)],
      stubs: { Teleport: true },
    },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

function rowResult(wrapper: VueWrapper, index: number) {
  const row = wrapper.find(`.ocf-name-split-row[data-row="${index}"]`)
  const textOf = (selector: string) => row.find(selector).text().replace(row.find(`${selector} .ocf-name-split-result-label`).text(), '').trim()
  return { lastName: textOf('.ocf-name-split-last'), firstName: textOf('.ocf-name-split-first') }
}

const classList = 'email,name\na@x.fr,Jean Marie DUPONT\nb@x.fr,Marie MARTIN\nc@x.fr,Madonna\n'

describe('CSVPreview name split editor', () => {
  it('appears for a file whose rows only have a single name column', async () => {
    const wrapper = await mountPreview(csvFile(classList))

    expect(wrapper.find('.ocf-name-split').exists()).toBe(true)
    expect(wrapper.findAll('.ocf-name-split-row')).toHaveLength(3)
    expect(wrapper.find('.ocf-name-split-title').text()).toBe('Split names')
  })

  it('lists every user, not only the ten previewed rows', async () => {
    const many = 'email,name\n' + Array.from({ length: 14 }, (_, i) => `u${i}@x.fr,NOM${i} Prenom\n`).join('')
    const wrapper = await mountPreview(csvFile(many))

    expect(wrapper.findAll('tbody tr')).toHaveLength(10)
    expect(wrapper.findAll('.ocf-name-split-row')).toHaveLength(14)
  })

  it('does not appear for a file with first_name and last_name columns', async () => {
    const wrapper = await mountPreview(csvFile('email,first_name,last_name\na@x.fr,Marie,DUPONT\n'))

    expect(wrapper.find('.ocf-name-split').exists()).toBe(false)
    expect(wrapper.findAll('thead th')).toHaveLength(3)
  })

  it('does not appear when no plan is given, as for the groups and memberships files', async () => {
    const wrapper = await mountPreview(csvFile(classList), null)

    expect(wrapper.find('.ocf-name-split').exists()).toBe(false)
  })

  it('shows the backend rule by default: cut before the last word, last name first', async () => {
    const wrapper = await mountPreview(csvFile(classList))

    expect(rowResult(wrapper, 0)).toEqual({ lastName: 'Jean Marie', firstName: 'DUPONT' })
    expect(rowResult(wrapper, 1)).toEqual({ lastName: 'Marie', firstName: 'MARTIN' })
  })

  it('flags a single-word name as last name only', async () => {
    const wrapper = await mountPreview(csvFile(classList))

    expect(rowResult(wrapper, 2)).toEqual({ lastName: 'Madonna', firstName: 'single word, used as last name' })
    expect(wrapper.find('.ocf-name-split-row[data-row="2"] .ocf-name-split-cut').exists()).toBe(false)
  })

  it('moves the cut of one row when a boundary is clicked, and marks that row adjusted', async () => {
    const wrapper = await mountPreview(csvFile(classList))

    await wrapper.findAll('.ocf-name-split-row[data-row="0"] .ocf-name-split-cut')[0].trigger('click')

    expect(rowResult(wrapper, 0)).toEqual({ lastName: 'Jean', firstName: 'Marie DUPONT' })
    expect(rowResult(wrapper, 1)).toEqual({ lastName: 'Marie', firstName: 'MARTIN' })
    expect(wrapper.find('.ocf-name-split-row[data-row="0"]').classes()).toContain('is-adjusted')
    expect(wrapper.props('nameSplit')?.overrides).toEqual({ 0: { cut: 1, order: 'last_first' } })
  })

  it('recomputes the rows the user did not adjust when the default order changes', async () => {
    const wrapper = await mountPreview(csvFile(classList))
    await wrapper.findAll('.ocf-name-split-row[data-row="0"] .ocf-name-split-cut')[0].trigger('click')

    await wrapper.find('.ocf-name-split-order-select').setValue('first_last')

    expect(rowResult(wrapper, 0)).toEqual({ lastName: 'Jean', firstName: 'Marie DUPONT' })
    expect(rowResult(wrapper, 1)).toEqual({ lastName: 'MARTIN', firstName: 'Marie' })
    expect(wrapper.props('nameSplit')?.order).toBe('first_last')
  })

  it('swaps the two sides of one row and lets the user go back to the default', async () => {
    const wrapper = await mountPreview(csvFile(classList))
    const row = () => wrapper.find('.ocf-name-split-row[data-row="1"]')

    await row().find('.ocf-name-split-swap').trigger('click')
    expect(rowResult(wrapper, 1)).toEqual({ lastName: 'MARTIN', firstName: 'Marie' })

    await row().find('.ocf-name-split-reset').trigger('click')
    expect(rowResult(wrapper, 1)).toEqual({ lastName: 'Marie', firstName: 'MARTIN' })
    expect(row().classes()).not.toContain('is-adjusted')
  })

  it('speaks French to a French reader', async () => {
    const wrapper = await mountPreview(csvFile(classList), emptyNameSplitPlan(), 'fr')

    expect(wrapper.find('.ocf-name-split-title').text()).toBe('Découper les noms')
    expect(wrapper.find('.ocf-name-split-order-select option').text()).toBe("Nom d'abord (DUPONT Marie)")
  })
})
