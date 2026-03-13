import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import TerminalAdvancedOptions from '../../src/components/Terminal/TerminalAdvancedOptions.vue'

/**
 * Create a fresh vue-i18n instance for test isolation.
 * The component registers its own translations via useTranslations(),
 * which calls mergeLocaleMessage internally.
 */
function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false
  })
}

/**
 * Helper: check if a v-show element is hidden (display: none inline style).
 * happy-dom does not compute styles for isVisible(), so we check the inline
 * style attribute that Vue's v-show directive sets directly.
 */
function isVShowHidden(el: ReturnType<VueWrapper['find']>): boolean {
  const style = el.attributes('style') || ''
  return style.includes('display: none')
}

/**
 * Mount the component with sensible defaults and a fresh i18n instance.
 * BackendSelector is stubbed because it has its own i18n setup that would
 * require additional configuration.
 */
function mountComponent(props: Record<string, unknown> = {}) {
  const i18n = createTestI18n()
  return mount(TerminalAdvancedOptions, {
    props: {
      modelValue: '',
      ...props
    },
    global: {
      plugins: [i18n],
      stubs: {
        BackendSelector: true
      }
    }
  })
}

describe('TerminalAdvancedOptions', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = mountComponent()
  })

  describe('collapsible header visibility', () => {
    it('renders the collapsible header with "Advanced Options" text', () => {
      const header = wrapper.find('.collapsible-header')
      expect(header.exists()).toBe(true)
      expect(header.text()).toContain('Advanced Options')
    })

    it('renders a chevron icon in the header', () => {
      const icon = wrapper.find('.collapsible-header i.fas')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('fa-chevron-right')
    })

    it('always renders the collapsible-section container', () => {
      const section = wrapper.find('.collapsible-section')
      expect(section.exists()).toBe(true)
    })
  })

  describe('collapsed state (default)', () => {
    it('hides the collapsible-content by default', () => {
      const content = wrapper.find('.collapsible-content')
      expect(content.exists()).toBe(true)
      // v-show sets display:none as an inline style
      expect(isVShowHidden(content)).toBe(true)
    })
  })

  describe('expanding and collapsing', () => {
    it('expands the content when the header is clicked', async () => {
      const header = wrapper.find('.collapsible-header')
      await header.trigger('click')

      const content = wrapper.find('.collapsible-content')
      expect(isVShowHidden(content)).toBe(false)
    })

    it('changes the chevron icon to down when expanded', async () => {
      const header = wrapper.find('.collapsible-header')
      await header.trigger('click')

      const icon = wrapper.find('.collapsible-header i.fas')
      expect(icon.classes()).toContain('fa-chevron-down')
      expect(icon.classes()).not.toContain('fa-chevron-right')
    })

    it('collapses the content when the header is clicked again', async () => {
      const header = wrapper.find('.collapsible-header')

      // Expand
      await header.trigger('click')
      expect(isVShowHidden(wrapper.find('.collapsible-content'))).toBe(false)

      // Collapse
      await header.trigger('click')
      expect(isVShowHidden(wrapper.find('.collapsible-content'))).toBe(true)
    })

    it('restores the chevron to right when collapsed again', async () => {
      const header = wrapper.find('.collapsible-header')

      await header.trigger('click') // expand
      await header.trigger('click') // collapse

      const icon = wrapper.find('.collapsible-header i.fas')
      expect(icon.classes()).toContain('fa-chevron-right')
    })
  })

  describe('form fields when expanded', () => {
    beforeEach(async () => {
      const header = wrapper.find('.collapsible-header')
      await header.trigger('click')
    })

    it('shows the terminal name input', () => {
      const nameInput = wrapper.find('input#terminalName')
      expect(nameInput.exists()).toBe(true)
      expect(nameInput.attributes('type')).toBe('text')
      expect(nameInput.attributes('maxlength')).toBe('255')
    })

    it('shows the hostname input', () => {
      const hostnameInput = wrapper.find('input#hostname')
      expect(hostnameInput.exists()).toBe(true)
      expect(hostnameInput.attributes('type')).toBe('text')
      expect(hostnameInput.attributes('maxlength')).toBe('63')
    })

    it('shows the exercise reference input', () => {
      const exerciseInput = wrapper.find('input#exerciseRef')
      expect(exerciseInput.exists()).toBe(true)
      expect(exerciseInput.attributes('type')).toBe('text')
      expect(exerciseInput.attributes('maxlength')).toBe('255')
    })

    it('shows the reset button', () => {
      const formActions = wrapper.find('.form-actions')
      expect(formActions.exists()).toBe(true)
      // The Button component renders a <button> element
      const resetButton = formActions.find('button')
      expect(resetButton.exists()).toBe(true)
    })
  })

  describe('conditional: backend selector', () => {
    it('does not show BackendSelector when showBackendSelector is false (default)', async () => {
      const header = wrapper.find('.collapsible-header')
      await header.trigger('click')

      const backendSelector = wrapper.findComponent({ name: 'BackendSelector' })
      expect(backendSelector.exists()).toBe(false)
    })

    it('shows BackendSelector when showBackendSelector is true', async () => {
      const w = mountComponent({
        showBackendSelector: true,
        backends: [{ id: 'b1', name: 'Backend 1', connected: true, is_default: true }],
        selectedBackendId: 'b1'
      })
      const header = w.find('.collapsible-header')
      await header.trigger('click')

      const backendSelector = w.findComponent({ name: 'BackendSelector' })
      expect(backendSelector.exists()).toBe(true)
    })
  })

  describe('i18n safety: no unescaped @ in translations', () => {
    it('does not trigger vue-i18n message compilation errors', async () => {
      // Regression test: vue-i18n treats @ as linked message syntax.
      // An unescaped @ (e.g., "root@hostname") causes a message compilation
      // error that silently kills the entire component in production mode.
      //
      // In dev/test mode, vue-i18n logs the error but still renders.
      // We detect the error by spying on console.warn.
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const w = mountComponent()
      const header = w.find('.collapsible-header')
      await header.trigger('click')

      const compilationErrors = errorSpy.mock.calls.filter(
        args => args.some(arg => typeof arg === 'string' && arg.includes('compilation error'))
      )

      errorSpy.mockRestore()

      expect(compilationErrors).toHaveLength(0)
    })
  })
})
