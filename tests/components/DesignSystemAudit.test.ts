/**
 * The admin design system audit page renders the real shared components and
 * shared classes, so any drift between them and the design system shows up there.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import axios from 'axios'
import i18n from '../../src/i18n'
import DesignSystemAudit from '../../src/components/Debug/DesignSystemAudit.vue'
import Button from '../../src/components/UI/Button.vue'
import FormGroup from '../../src/components/UI/FormGroup.vue'
import ErrorAlert from '../../src/components/UI/ErrorAlert.vue'
import SettingsCard from '../../src/components/UI/SettingsCard.vue'
import AdminBadge from '../../src/components/Common/AdminBadge.vue'
import BetaBadge from '../../src/components/Common/BetaBadge.vue'
import TabStrip from '../../src/components/Common/TabStrip.vue'
import DropdownMenu from '../../src/components/Common/DropdownMenu.vue'
import ClientPager from '../../src/components/Common/ClientPager.vue'
import ProgressBar from '../../src/components/Common/ProgressBar.vue'
import EmptyState from '../../src/components/Common/EmptyState.vue'
import EntityTable from '../../src/components/Generic/EntityTable.vue'
import BaseModal from '../../src/components/Modals/BaseModal.vue'

const source = readFileSync(
  resolve(__dirname, '../../src/components/Debug/DesignSystemAudit.vue'),
  'utf-8'
)
const styleBlock = source.match(/<style[^>]*>([\s\S]*)<\/style>/)?.[1] ?? ''

/** Class names used in the page's own selectors (comments and declaration bodies removed). */
const styledClasses = new Set(
  [...styleBlock
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{[^{}]*\}/g, ' ')
    .matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map(m => m[1])
)

/** The page's own layout classes: anything else would restyle the design system it audits. */
const OWN_CLASSES = [
  'design-system-audit', 'audit-header', 'theme-toggle', 'active', 'audit-grid',
  'audit-section', 'audit-section--wide', 'section-title', 'section-body', 'caption',
  'dsa-row', 'stack', 'token-list', 'token', 'token-swatch', 'table-scroll'
]

const colorTokens = [...new Set(
  readFileSync(resolve(__dirname, '../../src/assets/styles/variables.css'), 'utf-8')
    .match(/--color-[\w-]+(?=\s*:)/g)
)]

function mountPage() {
  return mount(DesignSystemAudit, {
    global: { plugins: [i18n], stubs: { 'router-link': RouterLinkStub } }
  })
}

describe('DesignSystemAudit', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    i18n.global.locale.value = 'en'
  })

  it('mounts without any network call', () => {
    const calls = (['get', 'post', 'put', 'patch', 'delete'] as const).map(m =>
      vi.spyOn(axios, m).mockRejectedValue(new Error('no network'))
    )
    const wrapper = mountPage()
    expect(wrapper.find('h1').exists()).toBe(true)
    calls.forEach(spy => expect(spy).not.toHaveBeenCalled())
  })

  it.each([
    ['Button', Button],
    ['FormGroup', FormGroup],
    ['ErrorAlert', ErrorAlert],
    ['SettingsCard', SettingsCard],
    ['AdminBadge', AdminBadge],
    ['BetaBadge', BetaBadge],
    ['TabStrip', TabStrip],
    ['DropdownMenu', DropdownMenu],
    ['ClientPager', ClientPager],
    ['ProgressBar', ProgressBar],
    ['EmptyState', EmptyState],
    ['EntityTable', EntityTable],
    ['BaseModal', BaseModal]
  ])('renders the real %s', (_name, component) => {
    expect(mountPage().findComponent(component).exists()).toBe(true)
  })

  it.each([
    '.btn.btn-primary',
    '.form-group .form-control',
    '.alert.alert-success',
    '.badge.badge-success',
    '.card',
    '.ocf-data-table',
    '.empty-state'
  ])('shows the shared class %s', selector => {
    expect(mountPage().find(selector).exists()).toBe(true)
  })

  it('styles only its own layout classes, without piercing child components', () => {
    expect([...styledClasses].filter(c => !OWN_CLASSES.includes(c))).toEqual([])
    expect(styleBlock).not.toMatch(/:deep|::v-deep|>>>/)
  })

  it.each([
    '--color-primary',
    '--color-success',
    '--color-warning',
    '--color-danger',
    '--color-text-primary',
    '--color-background',
    '--color-border'
  ])('shows a swatch for the token %s', token => {
    const wrapper = mountPage()
    const swatch = wrapper
      .findAll('[style]')
      .find(el => el.attributes('style')!.includes(`var(${token})`))
    expect(swatch, `no element styled with var(${token})`).toBeDefined()
    expect(wrapper.findAll('code').some(c => c.text() === token)).toBe(true)
  })

  it('labels a swatch for every color token defined in variables.css', () => {
    const labels = new Set(mountPage().findAll('code').map(c => c.text()))
    expect(colorTokens.filter(token => !labels.has(token))).toEqual([])
  })

  it('switches theme through the app theme, with pressed state on the toggle', async () => {
    const html = document.documentElement
    html.removeAttribute('data-theme')
    html.removeAttribute('data-bs-theme')
    html.classList.remove('dark')
    const [light, dark] = mountPage().findAll('.theme-toggle button')

    await dark.trigger('click')

    expect(html.getAttribute('data-theme'), 'data-theme').toBe('dark')
    expect(html.getAttribute('data-bs-theme'), 'data-bs-theme').toBe('dark')
    expect(html.classList.contains('dark'), 'dark class').toBe(true)
    expect(dark.attributes('aria-pressed'), 'dark aria-pressed').toBe('true')
    expect(light.attributes('aria-pressed'), 'light aria-pressed').toBe('false')
  })

  it('translates its title', async () => {
    const wrapper = mountPage()
    const english = wrapper.find('h1').text()
    i18n.global.locale.value = 'fr'
    await nextTick()
    expect(wrapper.find('h1').text()).not.toBe(english)
  })
})
