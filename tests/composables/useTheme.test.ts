import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useTheme } from '../../src/composables/useTheme'

describe('useTheme', () => {
  let localStorageMock: Record<string, string>

  beforeEach(() => {
    // Set up a simple localStorage mock backed by a plain object
    localStorageMock = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { localStorageMock[key] = value }),
      removeItem: vi.fn((key: string) => { delete localStorageMock[key] }),
    })

    // Default matchMedia: prefers-color-scheme dark = false
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('setTheme', () => {
    it('writes "dark" to localStorage and sets data-theme on html element', () => {
      const { setTheme } = useTheme()
      setTheme('dark')
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('writes "light" to localStorage and sets data-theme to light', () => {
      const { setTheme } = useTheme()
      setTheme('light')
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('writes "auto" to localStorage', () => {
      const { setTheme } = useTheme()
      setTheme('auto')
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'auto')
    })

    it('updates currentTheme ref when called', () => {
      const { setTheme, currentTheme } = useTheme()
      setTheme('dark')
      expect(currentTheme.value).toBe('dark')
      setTheme('light')
      expect(currentTheme.value).toBe('light')
    })
  })

  describe('applyTheme', () => {
    it('sets data-theme to dark for dark theme', () => {
      const { applyTheme } = useTheme()
      applyTheme('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('sets data-theme to light for light theme', () => {
      const { applyTheme } = useTheme()
      applyTheme('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('resolves auto to system preference', () => {
      vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })))

      const { applyTheme } = useTheme()
      applyTheme('auto')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })
  })

  describe('initTheme', () => {
    it('loads theme from localStorage and applies it', () => {
      localStorageMock['theme'] = 'dark'
      const { initTheme } = useTheme()
      initTheme()
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('defaults to light when localStorage is empty', () => {
      const { initTheme } = useTheme()
      initTheme()
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('updates currentTheme ref from localStorage', () => {
      localStorageMock['theme'] = 'dark'
      const { initTheme, currentTheme } = useTheme()
      initTheme()
      expect(currentTheme.value).toBe('dark')
    })
  })
})
