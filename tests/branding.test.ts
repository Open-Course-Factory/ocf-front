import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'
import { applyBrandingStyle, brandingLogoUrl, defaultBranding, useBrandingStore } from '../src/stores/branding'

vi.mock('axios', () => ({ default: { get: vi.fn(), put: vi.fn(), defaults: { baseURL: 'https://api.test/api/v1' } } }))

const brandStyle = () => document.getElementById('ocf-branding')
const variablesCss = readFileSync(resolve(__dirname, '../src/assets/styles/variables.css'), 'utf8')

function computedToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

describe('instance branding', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    document.head.innerHTML = ''
    document.documentElement.removeAttribute('style')
    document.documentElement.removeAttribute('data-theme')
  })

  it('injects nothing when the branding is the OCF default', () => {
    applyBrandingStyle({ ...defaultBranding, primary_color: '#007BFF' })
    expect(brandStyle()).toBeNull()
    expect(document.documentElement.getAttribute('style')).toBeNull()
  })

  it('removes a previously injected style when reverting to defaults', () => {
    applyBrandingStyle({ ...defaultBranding, primary_color: '#123456' })
    applyBrandingStyle(defaultBranding)
    expect(brandStyle()).toBeNull()
  })

  it('overrides only the brand base tokens, never inline on <html>', () => {
    applyBrandingStyle({ ...defaultBranding, primary_color: '#123456' })
    const rules = brandStyle()?.textContent ?? ''
    expect(rules).toContain('--color-primary: #123456')
    expect(rules).toContain('--color-primary-rgb: 18, 52, 86')
    expect(rules).not.toMatch(/--color-primary-(bg|light|shadow)/)
    expect(rules).not.toContain('--color-secondary')
    expect(document.documentElement.getAttribute('style')).toBeNull()
  })

  it('leaves the dark theme in charge of its own tints', () => {
    const theme = document.createElement('style')
    theme.textContent = variablesCss
    document.head.appendChild(theme)
    document.documentElement.setAttribute('data-theme', 'dark')

    applyBrandingStyle({ ...defaultBranding, primary_color: '#123456' })

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(computedToken('--color-primary')).toBe('#123456')
    expect(computedToken('--color-text-primary')).toBe('#f5f5f5')
    // The dark rule still decides the tint opacity; only the hue is the brand's.
    expect(computedToken('--color-primary-bg').replace(/\s/g, '')).toMatch(/^rgba\((var\(--color-primary-rgb\)|18,52,86),0\.15\)$/)
  })

  it('versions the logo URL and has none without a logo', () => {
    expect(brandingLogoUrl(defaultBranding)).toBe('')
    expect(brandingLogoUrl({ ...defaultBranding, logo_version: 'abc' })).toBe('https://api.test/api/v1/branding/logo?v=abc')
  })

  it('keeps saved branding when an unauthorized update is rejected', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { ...defaultBranding, name: 'Classe A' } })
    vi.mocked(axios.put).mockRejectedValue(new Error('Forbidden'))
    const store = useBrandingStore()
    await store.load()
    await expect(store.save({ ...defaultBranding, name: 'Changed' })).rejects.toThrow()
    expect(store.branding.name).toBe('Classe A')
  })

  it('uses the normalized server response after saving', async () => {
    vi.mocked(axios.put).mockResolvedValue({ data: { ...defaultBranding, name: 'Foehn' } })
    const store = useBrandingStore()
    await store.save({ ...defaultBranding, name: ' Foehn ' })
    expect(store.branding.name).toBe('Foehn')
  })
})
