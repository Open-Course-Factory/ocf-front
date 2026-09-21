import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'
import { applyBrandingColors, defaultBranding, useBrandingStore } from '../src/stores/branding'

vi.mock('axios', () => ({ default: { get: vi.fn(), put: vi.fn() } }))

describe('instance branding', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.resetAllMocks(); document.documentElement.removeAttribute('style') })
  it('updates brand tokens without changing the personal dark theme', () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    applyBrandingColors({ ...defaultBranding, primary_color: '#123456' })
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#123456')
    expect(document.documentElement.style.getPropertyValue('--color-primary-rgb')).toBe('18, 52, 86')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
  it('keeps saved branding when an unauthorized update is rejected', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { ...defaultBranding, name: 'Classe A' } })
    vi.mocked(axios.put).mockRejectedValue(new Error('Forbidden'))
    const store = useBrandingStore()
    await store.load()
    await expect(store.save({ ...defaultBranding, name: 'Changed' })).rejects.toThrow()
    expect(store.branding.name).toBe('Classe A')
  })
  it('chooses readable foregrounds for both light and dark brand colors', () => {
    applyBrandingColors({ ...defaultBranding, primary_color: '#ffffff', secondary_color: '#123456' })
    expect(document.documentElement.style.getPropertyValue('--color-on-primary')).toBe('var(--color-black)')
    expect(document.documentElement.style.getPropertyValue('--color-on-secondary')).toBe('var(--color-white)')
  })
  it('uses the normalized server response after saving', async () => {
    vi.mocked(axios.put).mockResolvedValue({ data: { ...defaultBranding, name: 'Foehn' } })
    const store = useBrandingStore()
    await store.save({ ...defaultBranding, name: ' Foehn ' })
    expect(store.branding.name).toBe('Foehn')
  })
})
