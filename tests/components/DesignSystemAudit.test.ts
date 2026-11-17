/**
 * The admin design system audit page: it works offline, lists every color
 * token, switches the app theme and is translated.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import axios from 'axios'
import i18n from '../../src/i18n'
import DesignSystemAudit from '../../src/components/Debug/DesignSystemAudit.vue'

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
