import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

// ---- Mocks (must be before component imports) ----

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

vi.mock('../../src/services/core/error', () => ({
  handleStoreError: vi.fn((err: any, fallbackKey: string) => fallbackKey)
}))

// Mock the i18n module used by useStoreTranslations (for currentUser store)
vi.mock('../../src/i18n', () => {
  const { createI18n } = require('vue-i18n')
  const instance = createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
  return { default: instance }
})

// Mock services used by currentUser store
vi.mock('../../src/services/auth', () => ({
  tokenService: {
    getAccessToken: vi.fn(() => 'mock-token'),
    setAccessToken: vi.fn(),
    clearTokens: vi.fn(),
    hasValidToken: vi.fn(() => true),
    getTimeUntilExpiry: vi.fn(() => 3600000)
  },
  authService: {
    getVerificationStatus: vi.fn().mockResolvedValue({
      verified: true,
      verified_at: '2024-01-01',
      email: 'test@example.com'
    })
  }
}))

vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({ show: vi.fn(), remove: vi.fn(), update: vi.fn() })
}))

// Mock the router module
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: mockPush }),
  createRouter: vi.fn(),
  createWebHistory: vi.fn()
}))

// Mock the router default export used by the currentUser store
vi.mock('../../src/router/index', () => ({
  default: {
    push: vi.fn(),
    currentRoute: { value: { meta: {}, name: 'Login', fullPath: '/login' } }
  }
}))

vi.mock('../../src/services/core/storage', () => ({
  getSavedLocale: () => 'en'
}))

const mockSetLocale = vi.fn()
vi.mock('../../src/composables/useLocale', () => ({
  useLocale: () => ({ setLocale: mockSetLocale, currentLocale: { value: 'en' } })
}))

const mockSetTheme = vi.fn()
vi.mock('../../src/composables/useTheme', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    initTheme: vi.fn(),
    currentTheme: { value: 'light' }
  })
}))

const mockRefreshAfterLogin = vi.fn().mockResolvedValue(undefined)
const mockWaitForInit = vi.fn().mockResolvedValue(undefined)
vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    refreshAfterLogin: mockRefreshAfterLogin,
    waitForInitialization: mockWaitForInit,
    isEnabled: () => true
  })
}))

// Mock useStoreTranslations for stores that call it at module level
vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: (messages: any) => {
    // Build a flat key lookup from the messages.en object
    const flatMap: Record<string, string> = {}
    function flatten(obj: any, prefix: string) {
      for (const key of Object.keys(obj)) {
        const val = obj[key]
        const path = prefix ? `${prefix}.${key}` : key
        if (typeof val === 'string') {
          flatMap[path] = val
        } else if (typeof val === 'object' && val !== null) {
          flatten(val, path)
        }
      }
    }
    if (messages?.en) flatten(messages.en, '')
    return {
      t: (key: string) => flatMap[key] || key,
      te: () => true,
      locale: { value: 'en' }
    }
  },
  useStoreTranslations: () => ({
    t: (key: string) => key,
    te: () => true,
    locale: { value: 'en' }
  })
}))

// Mock the formatters utility (used by userSettings store)
vi.mock('../../src/utils/formatters', () => ({
  formatDate: (d: string) => d,
  COMMON_TIMEZONES: []
}))

// Mock asyncWrapper used by userSettings store
vi.mock('../../src/utils/asyncWrapper', () => ({
  createAsyncWrapper: () => async (fn: Function, _errKey: string) => fn()
}))

import Login from '../../src/components/Pages/Login.vue'
import axios from 'axios'

const mockPost = vi.mocked(axios.post)

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

function mountLogin() {
  const i18n = createTestI18n()
  setActivePinia(createPinia())

  return mount(Login, {
    global: {
      plugins: [i18n],
      stubs: {
        'router-link': {
          template: '<a class="router-link-stub"><slot /></a>',
          props: ['to']
        }
      }
    }
  })
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('rendering', () => {
    it('renders the login form', () => {
      const wrapper = mountLogin()
      expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true)
    })

    it('renders email input field', () => {
      const wrapper = mountLogin()
      const emailInput = wrapper.find('[data-testid="login-email-input"]')
      expect(emailInput.exists()).toBe(true)
      expect(emailInput.attributes('type')).toBe('email')
      expect(emailInput.attributes('autocomplete')).toBe('email')
    })

    it('renders password input field', () => {
      const wrapper = mountLogin()
      const passwordInput = wrapper.find('[data-testid="login-password-input"]')
      expect(passwordInput.exists()).toBe(true)
      expect(passwordInput.attributes('type')).toBe('password')
      expect(passwordInput.attributes('autocomplete')).toBe('current-password')
    })

    it('renders remember me checkbox', () => {
      const wrapper = mountLogin()
      const checkbox = wrapper.find('[data-testid="login-remember-me"]')
      expect(checkbox.exists()).toBe(true)
      expect(checkbox.attributes('type')).toBe('checkbox')
    })

    it('renders submit button', () => {
      const wrapper = mountLogin()
      const submitBtn = wrapper.find('[data-testid="login-submit"]')
      expect(submitBtn.exists()).toBe(true)
    })

    it('renders forgot password link', () => {
      const wrapper = mountLogin()
      const forgotLink = wrapper.find('[data-testid="login-forgot-password"]')
      expect(forgotLink.exists()).toBe(true)
    })

    it('renders register link', () => {
      const wrapper = mountLogin()
      const registerDiv = wrapper.find('[data-testid="login-register-link"]')
      expect(registerDiv.exists()).toBe(true)
    })
  })

  describe('password toggle', () => {
    it('starts with password hidden', () => {
      const wrapper = mountLogin()
      const passwordInput = wrapper.find('[data-testid="login-password-input"]')
      expect(passwordInput.attributes('type')).toBe('password')
    })

    it('toggles password visibility when toggle button is clicked', async () => {
      const wrapper = mountLogin()
      const toggleBtn = wrapper.find('[data-testid="login-password-toggle"]')
      expect(toggleBtn.exists()).toBe(true)

      // Click to show password
      await toggleBtn.trigger('click')
      expect(wrapper.find('[data-testid="login-password-input"]').attributes('type')).toBe('text')

      // Click to hide password again
      await toggleBtn.trigger('click')
      expect(wrapper.find('[data-testid="login-password-input"]').attributes('type')).toBe('password')
    })

    it('toggles the eye icon on password toggle', async () => {
      const wrapper = mountLogin()
      const toggleBtn = wrapper.find('[data-testid="login-password-toggle"]')

      // Initially should show the "eye" icon (password is hidden)
      expect(toggleBtn.find('i').classes()).toContain('fa-eye')

      await toggleBtn.trigger('click')

      // After toggle should show "eye-slash" icon (password is visible)
      expect(toggleBtn.find('i').classes()).toContain('fa-eye-slash')
    })
  })

  describe('form submission', () => {
    it('calls axios.post with email and password on submit', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          access_token: 'test-token',
          user_name: 'testuser',
          display_name: 'Test User',
          user_id: 'user-123',
          user_roles: ['Member'],
          email: 'test@example.com'
        }
      })

      const wrapper = mountLogin()

      // Fill in credentials
      await wrapper.find('[data-testid="login-email-input"]').setValue('test@example.com')
      await wrapper.find('[data-testid="login-password-input"]').setValue('password123')

      // Submit form
      await wrapper.find('[data-testid="login-form"]').trigger('submit')
      await flushPromises()

      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('shows error message on failed login', async () => {
      mockPost.mockRejectedValueOnce(new Error('Invalid credentials'))

      const wrapper = mountLogin()

      await wrapper.find('[data-testid="login-email-input"]').setValue('bad@example.com')
      await wrapper.find('[data-testid="login-password-input"]').setValue('wrongpass')
      await wrapper.find('[data-testid="login-form"]').trigger('submit')
      await flushPromises()

      const alert = wrapper.find('[data-testid="login-error"]')
      expect(alert.exists()).toBe(true)
      // useTranslations mock resolves the English translations from the component
      expect(alert.text()).toContain('Invalid email or password')
    })

    it('shows loading state during submission', async () => {
      // Create a promise that we control
      let resolveLogin!: (value: any) => void
      const loginPromise = new Promise((resolve) => { resolveLogin = resolve })
      mockPost.mockReturnValueOnce(loginPromise)

      const wrapper = mountLogin()

      await wrapper.find('[data-testid="login-email-input"]').setValue('test@example.com')
      await wrapper.find('[data-testid="login-password-input"]').setValue('password123')
      await wrapper.find('[data-testid="login-form"]').trigger('submit')
      await nextTick()

      // Submit button should be disabled during loading
      const submitBtn = wrapper.find('[data-testid="login-submit"]')
      expect((submitBtn.element as HTMLButtonElement).disabled).toBe(true)

      // Should show the spinner text (resolved from component's inline translations)
      expect(submitBtn.text()).toContain('Signing in...')

      // Clean up the pending promise
      resolveLogin({
        data: {
          access_token: 'token',
          user_name: 'test',
          user_id: 'id',
          user_roles: []
        }
      })
      await flushPromises()
    })

    it('clears error message on new submission', async () => {
      // First submission fails
      mockPost.mockRejectedValueOnce(new Error('fail'))

      const wrapper = mountLogin()
      await wrapper.find('[data-testid="login-email-input"]').setValue('test@example.com')
      await wrapper.find('[data-testid="login-password-input"]').setValue('wrong')
      await wrapper.find('[data-testid="login-form"]').trigger('submit')
      await flushPromises()

      expect(wrapper.find('[data-testid="login-error"]').exists()).toBe(true)

      // Second submission — error should be cleared before the new attempt
      mockPost.mockResolvedValueOnce({
        data: {
          access_token: 'token',
          user_name: 'test',
          user_id: 'id',
          user_roles: []
        }
      })

      await wrapper.find('[data-testid="login-form"]').trigger('submit')
      await nextTick()

      // Error message should be cleared (the new request is in progress)
      expect(wrapper.find('[data-testid="login-error"]').exists()).toBe(false)
    })
  })

  describe('submit button state', () => {
    it('is enabled when not loading', () => {
      const wrapper = mountLogin()
      const submitBtn = wrapper.find('[data-testid="login-submit"]')
      expect((submitBtn.element as HTMLButtonElement).disabled).toBe(false)
    })

    it('shows sign in text when not loading', () => {
      const wrapper = mountLogin()
      const submitBtn = wrapper.find('[data-testid="login-submit"]')
      expect(submitBtn.text()).toContain('Sign in')
    })
  })
})
