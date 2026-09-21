import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface Branding {
  name: string
  logo: string
  primary_color: string
  secondary_color: string
}

export const defaultBranding: Branding = {
  name: 'OCF', logo: '', primary_color: '#007bff', secondary_color: '#6c757d'
}

export function applyBrandingColors(brand: Branding) {
  const style = document.documentElement.style
  for (const [name, color] of [['primary', brand.primary_color], ['secondary', brand.secondary_color]]) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) continue
    const rgb = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16))
    const hoverRGB = rgb.map(value => Math.round(value * 0.8))
    const hover = `rgb(${hoverRGB.join(', ')})`
    const foreground = (channels: number[]) => {
      const linear = channels.map(value => value / 255 <= 0.04045 ? value / 255 / 12.92 : ((value / 255 + 0.055) / 1.055) ** 2.4)
      const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
      return luminance > 0.179 ? 'var(--color-black)' : 'var(--color-white)'
    }
    style.setProperty(`--color-${name}`, color)
    style.setProperty(`--color-${name}-hover`, hover)
    style.setProperty(`--color-on-${name}`, foreground(rgb))
    style.setProperty(`--color-on-${name}-hover`, foreground(hoverRGB))
    if (name === 'primary') {
      style.setProperty('--color-primary-dark', hover)
      style.setProperty('--color-primary-rgb', rgb.join(', '))
      for (const suffix of ['light', 'bg']) style.setProperty(`--color-primary-${suffix}`, `rgba(${rgb.join(', ')}, 0.1)`)
      style.setProperty('--color-primary-shadow', `rgba(${rgb.join(', ')}, 0.2)`)
    }
  }
}

export const useBrandingStore = defineStore('branding', () => {
  const branding = ref<Branding>({ ...defaultBranding })
  function apply(value: Branding) {
    branding.value = value
    applyBrandingColors(value)
  }
  async function load() {
    const { data } = await axios.get<Branding>('/branding')
    apply(data)
  }
  async function save(value: Branding) {
    const { data } = await axios.put<Branding>('/branding', value)
    apply(data)
  }
  return { branding, load, save }
})
