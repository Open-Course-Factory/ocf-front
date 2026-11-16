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

  it.each([
    '.btn',
    '.card',
    '.badge',
    '.alert',
    '.form-group',
    '.form-control',
    '.empty-state',
    '.ocf-data-table'
  ])('does not restyle the shared selector %s in its own <style>', selector => {
    const escaped = selector.replace('.', '\\.')
    expect(styleBlock).not.toMatch(new RegExp(`${escaped}(?![\\w-])`))
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
    expect(wrapper.text()).toMatch(new RegExp(`${token}(?![\\w-])`))
  })

  it('translates its title', async () => {
    const wrapper = mountPage()
    const english = wrapper.find('h1').text()
    i18n.global.locale.value = 'fr'
    await nextTick()
    expect(wrapper.find('h1').text()).not.toBe(english)
  })
})
