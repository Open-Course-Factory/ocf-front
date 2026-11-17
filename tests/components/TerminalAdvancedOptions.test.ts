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
      // A hostname label is at most 63 characters (RFC 1035).
      expect(wrapper.find('input#hostname').attributes('maxlength')).toBe('63')
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

  describe('network toggle + packages gating', () => {
    it('always renders the network toggle, even when networkPlanEnabled is false', () => {
      const w = mountComponent({ networkPlanEnabled: false, networkEnabled: false })

      expect(w.find('[data-testid="network-toggle"]').exists()).toBe(true)
    })

    it('disables the network radios and shows a locked hint when the plan disallows network', () => {
      const w = mountComponent({ networkPlanEnabled: false, networkEnabled: false })

      const off = w.find('[data-testid="network-off"]')
      const on = w.find('[data-testid="network-on"]')
      expect(off.attributes('disabled')).toBeDefined()
      expect(on.attributes('disabled')).toBeDefined()
      // Forced visually to OFF.
      expect((off.element as HTMLInputElement).checked).toBe(true)
      expect((on.element as HTMLInputElement).checked).toBe(false)
      // Locked reason hint shown.
      expect(w.find('[data-testid="network-locked-hint"]').exists()).toBe(true)
    })

    it('cannot be turned on when the plan disallows network (forced off)', () => {
      // Even if a stale networkEnabled=true leaks in, the plan gate forces off.
      const w = mountComponent({ networkPlanEnabled: false, networkEnabled: true })

      const on = w.find('[data-testid="network-on"]')
      expect(on.attributes('disabled')).toBeDefined()
      expect((on.element as HTMLInputElement).checked).toBe(false)
    })

    it('always renders the packages input but disables it when network is off', () => {
      const w = mountComponent({ networkPlanEnabled: true, networkEnabled: false })

      const packages = w.find('input#packages')
      expect(packages.exists()).toBe(true)
      expect(packages.attributes('disabled')).toBeDefined()
      // Reason warning explaining internet is required: rendered inline beside
      // the field title when network is off.
      const hint = w.find('[data-testid="packages-network-required-hint"]')
      expect(hint.exists()).toBe(true)
    })

    it('enables the packages input when network is allowed and on', () => {
      const w = mountComponent({ networkPlanEnabled: true, networkEnabled: true })

      const packages = w.find('input#packages')
      expect(packages.exists()).toBe(true)
      expect(packages.attributes('disabled')).toBeUndefined()
      // When network is on, the warning is not rendered at all — no reserved
      // gap below the input, so the layout never reflows.
      const hint = w.find('[data-testid="packages-network-required-hint"]')
      expect(hint.exists()).toBe(false)
    })

    it('enables the network radios when the plan allows network', () => {
      const w = mountComponent({ networkPlanEnabled: true, networkEnabled: false })

      const off = w.find('[data-testid="network-off"]')
      const on = w.find('[data-testid="network-on"]')
      expect(off.attributes('disabled')).toBeUndefined()
      expect(on.attributes('disabled')).toBeUndefined()
      expect(w.find('[data-testid="network-locked-hint"]').exists()).toBe(false)
    })

    it('emits update:networkEnabled=true when the "on" radio is selected', async () => {
      const w = mountComponent({ networkPlanEnabled: true, networkEnabled: false })

      await w.find('[data-testid="network-on"]').trigger('change')

      const emitted = w.emitted('update:networkEnabled')
      expect(emitted).toBeTruthy()
      expect(emitted![emitted!.length - 1]).toEqual([true])
    })

    it('emits update:networkEnabled=false when the "off" radio is selected', async () => {
      const w = mountComponent({ networkPlanEnabled: true, networkEnabled: true })

      await w.find('[data-testid="network-off"]').trigger('change')

      const emitted = w.emitted('update:networkEnabled')
      expect(emitted).toBeTruthy()
      expect(emitted![emitted!.length - 1]).toEqual([false])
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
