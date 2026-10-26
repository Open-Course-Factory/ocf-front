import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface Branding {
  name: string
  logo_version: string
  logo_width: number
  logo_height: number
  primary_color: string
  secondary_color: string
}

/** PUT body: omit logo to keep it, '' removes it, a data URI replaces it. */
export interface BrandingUpdate {
  name: string
  primary_color: string
  secondary_color: string
  logo?: string
}

export const defaultBranding: Branding = {
  name: 'OCF', logo_version: '', logo_width: 0, logo_height: 0, primary_color: '#007bff', secondary_color: '#6c757d'
}

const STYLE_ELEMENT_ID = 'ocf-branding'

function channels(hex: string): number[] {
  return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16))
}

function darkened(rgb: number[]): string {
  return `rgb(${rgb.map(value => Math.round(value * 0.8)).join(', ')})`
}

/**
 * CSS overriding only the brand base tokens that differ from variables.css.
 * Everything else (light/bg/shadow tints, dark-theme variants) derives from
 * these tokens there, so theme rules keep working. '' when on defaults.
 */
export function brandingStyleRules(brand: Branding): string {
  const declarations: string[] = []
  if (brand.primary_color.toLowerCase() !== defaultBranding.primary_color) {
    const rgb = channels(brand.primary_color)
    declarations.push(
      `--color-primary: ${brand.primary_color}`,
      `--color-primary-hover: ${darkened(rgb)}`,
      `--color-primary-dark: ${darkened(rgb)}`,
      `--color-primary-rgb: ${rgb.join(', ')}`
    )
  }
  if (brand.secondary_color.toLowerCase() !== defaultBranding.secondary_color) {
    declarations.push(
      `--color-secondary: ${brand.secondary_color}`,
      `--color-secondary-hover: ${darkened(channels(brand.secondary_color))}`
    )
  }
  return declarations.length ? `:root { ${declarations.join('; ')}; }` : ''
}

export function applyBrandingStyle(brand: Branding) {
  const rules = brandingStyleRules(brand)
  let element = document.getElementById(STYLE_ELEMENT_ID)
  if (!rules) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('style')
    element.id = STYLE_ELEMENT_ID
    document.head.appendChild(element)
  }
  element.textContent = rules
}

/** Versioned so a new logo busts the browser cache; '' when there is none. */
export function brandingLogoUrl(brand: Branding): string {
  return brand.logo_version ? `${axios.defaults.baseURL ?? ''}/branding/logo?v=${brand.logo_version}` : ''
}

export const useBrandingStore = defineStore('branding', () => {
  const branding = ref<Branding>({ ...defaultBranding })
  function apply(value: Branding) {
    branding.value = value
    applyBrandingStyle(value)
  }
  async function load() {
    const { data } = await axios.get<Branding>('/branding')
    apply(data)
  }
  async function save(value: BrandingUpdate) {
    const { data } = await axios.put<Branding>('/branding', value)
    apply(data)
  }
  return { branding, load, save }
})
