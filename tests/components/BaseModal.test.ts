import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { defineComponent, h, nextTick, ref } from 'vue'
import BaseModal from '../../src/components/Modals/BaseModal.vue'

function createTestI18n(locale = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false
  })
}

function mountModal(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  const i18n = createTestI18n()
  return mount(BaseModal, {
    props: {
      visible: true,
      ...props
    },
    slots,
    global: {
      plugins: [i18n]
    }
  })
}

describe('BaseModal', () => {
  describe('visibility', () => {
    it('renders when visible is true', () => {
      const wrapper = mountModal({ visible: true })
      expect(wrapper.find('.base-modal-overlay').exists()).toBe(true)
    })

    it('does not render when visible is false', () => {
      const wrapper = mountModal({ visible: false })
      expect(wrapper.find('.base-modal-overlay').exists()).toBe(false)
    })
  })

  describe('size variants', () => {
    it.each([
      ['small', 'base-modal-small'],
      ['medium', 'base-modal-medium'],
      ['large', 'base-modal-large'],
      ['xlarge', 'base-modal-xlarge']
    ])('applies %s size class', (size, expectedClass) => {
      const wrapper = mountModal({ size })
      expect(wrapper.find('.base-modal-container').classes()).toContain(expectedClass)
    })

    it('defaults to medium size', () => {
      const wrapper = mountModal()
      expect(wrapper.find('.base-modal-container').classes()).toContain('base-modal-medium')
    })
  })

  describe('loading state', () => {
    it('shows spinner when isLoading is true', () => {
      const wrapper = mountModal({ isLoading: true })
      expect(wrapper.find('.base-modal-loading').exists()).toBe(true)
    })

    it('hides default slot content when loading', () => {
      const wrapper = mountModal(
        { isLoading: true },
        { default: '<p class="test-content">Hello</p>' }
      )
      expect(wrapper.find('.test-content').exists()).toBe(false)
      expect(wrapper.find('.base-modal-loading').exists()).toBe(true)
    })

    it('shows loading text when provided', () => {
      const wrapper = mountModal({ isLoading: true, loadingText: 'Please wait...' })
      expect(wrapper.find('.base-modal-loading').text()).toContain('Please wait...')
    })

    it('hides close button when loading', () => {
      const wrapper = mountModal({ isLoading: true, showClose: true })
      expect(wrapper.find('.base-modal-close').exists()).toBe(false)
    })

    it('prevents close on overlay click when loading', async () => {
      const wrapper = mountModal({ isLoading: true, closeOnOverlayClick: true })
      await wrapper.find('.base-modal-overlay').trigger('click')
      expect(wrapper.emitted('close')).toBeUndefined()
    })
  })

  describe('success message', () => {
    it('shows success alert when successMessage is set', () => {
      const wrapper = mountModal({ successMessage: 'Operation completed!' })
      const alert = wrapper.find('.alert-success')
      expect(alert.exists()).toBe(true)
      expect(alert.text()).toContain('Operation completed!')
    })

    it('hides default slot content when successMessage is set', () => {
      const wrapper = mountModal(
        { successMessage: 'Done' },
        { default: '<p class="test-content">Hello</p>' }
      )
      expect(wrapper.find('.test-content').exists()).toBe(false)
    })
  })

  describe('error message', () => {
    it('shows error alert when errorMessage is set', () => {
      const wrapper = mountModal({ errorMessage: 'Something failed' })
      const alert = wrapper.find('.alert-danger')
      expect(alert.exists()).toBe(true)
      expect(alert.text()).toContain('Something failed')
    })

    it('hides default slot content when errorMessage is set', () => {
      const wrapper = mountModal(
        { errorMessage: 'Error occurred' },
        { default: '<p class="test-content">Hello</p>' }
      )
      expect(wrapper.find('.test-content').exists()).toBe(false)
    })
  })

  describe('close button', () => {
    it('shows close button by default', () => {
      const wrapper = mountModal()
      expect(wrapper.find('.base-modal-close').exists()).toBe(true)
    })

    it('emits close event when close button is clicked', async () => {
      const wrapper = mountModal()
      await wrapper.find('.base-modal-close').trigger('click')
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('hides close button when showClose is false', () => {
      const wrapper = mountModal({ showClose: false })
      expect(wrapper.find('.base-modal-close').exists()).toBe(false)
    })

    it('uses custom closeLabel as aria-label', () => {
      const wrapper = mountModal({ closeLabel: 'Dismiss' })
      expect(wrapper.find('.base-modal-close').attributes('aria-label')).toBe('Dismiss')
    })

    it('falls back to "Close" when no closeLabel is provided', () => {
      const wrapper = mountModal()
      expect(wrapper.find('.base-modal-close').attributes('aria-label')).toBe('Close')
    })
  })

  describe('overlay click', () => {
    it('emits close on overlay click when closeOnOverlayClick is true (default)', async () => {
      const wrapper = mountModal()
      await wrapper.find('.base-modal-overlay').trigger('click')
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('does not emit close on overlay click when closeOnOverlayClick is false', async () => {
      const wrapper = mountModal({ closeOnOverlayClick: false })
      await wrapper.find('.base-modal-overlay').trigger('click')
      expect(wrapper.emitted('close')).toBeUndefined()
    })

    it('does not emit close when clicking inside the container', async () => {
      const wrapper = mountModal()
      await wrapper.find('.base-modal-container').trigger('click')
      expect(wrapper.emitted('close')).toBeUndefined()
    })
  })

  describe('title and titleIcon', () => {
    it('renders title text', () => {
      const wrapper = mountModal({ title: 'My Modal Title' })
      expect(wrapper.find('.base-modal-title').text()).toContain('My Modal Title')
    })

    it('renders title icon when titleIcon is provided', () => {
      const wrapper = mountModal({ title: 'Title', titleIcon: 'fas fa-info-circle' })
      const icon = wrapper.find('.base-modal-title i')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('fas')
      expect(icon.classes()).toContain('fa-info-circle')
    })

    it('does not render title icon when titleIcon is empty', () => {
      const wrapper = mountModal({ title: 'Title' })
      expect(wrapper.find('.base-modal-title i').exists()).toBe(false)
    })

    it('renders header section when title is provided', () => {
      const wrapper = mountModal({ title: 'Test' })
      expect(wrapper.find('.base-modal-header').exists()).toBe(true)
    })

    it('does not render header when no title and no header slot', () => {
      const wrapper = mountModal()
      expect(wrapper.find('.base-modal-header').exists()).toBe(false)
    })
  })

  describe('default footer', () => {
    it('shows confirm and cancel buttons when showDefaultFooter is true', () => {
      const wrapper = mountModal({
        showDefaultFooter: true,
        confirmText: 'Save',
        cancelText: 'Cancel'
      })
      const footer = wrapper.find('.base-modal-footer')
      expect(footer.exists()).toBe(true)

      const buttons = footer.findAll('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0].text()).toContain('Save')
      expect(buttons[1].text()).toContain('Cancel')
    })

    it('emits confirm when confirm button is clicked', async () => {
      const wrapper = mountModal({
        showDefaultFooter: true,
        confirmText: 'OK'
      })
      const confirmBtn = wrapper.find('.btn-primary')
      await confirmBtn.trigger('click')
      expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('emits close when cancel button is clicked', async () => {
      const wrapper = mountModal({
        showDefaultFooter: true,
        cancelText: 'Cancel'
      })
      const cancelBtn = wrapper.find('.btn-secondary')
      await cancelBtn.trigger('click')
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('disables confirm button when confirmDisabled is true', () => {
      const wrapper = mountModal({
        showDefaultFooter: true,
        confirmText: 'Save',
        confirmDisabled: true
      })
      const confirmBtn = wrapper.find('.btn-primary')
      expect((confirmBtn.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('renders confirm icon when provided', () => {
      const wrapper = mountModal({
        showDefaultFooter: true,
        confirmText: 'Save',
        confirmIcon: 'fas fa-save'
      })
      const icon = wrapper.find('.btn-primary i')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('fa-save')
    })

    it('renders cancel icon when provided', () => {
      const wrapper = mountModal({
        showDefaultFooter: true,
        cancelText: 'Back',
        cancelIcon: 'fas fa-arrow-left'
      })
      const icon = wrapper.find('.btn-secondary i')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('fa-arrow-left')
    })

    it('does not render footer when showDefaultFooter is false and no footer slot', () => {
      const wrapper = mountModal({ showDefaultFooter: false })
      expect(wrapper.find('.base-modal-footer').exists()).toBe(false)
    })
  })

  describe('confirm variant and test ids', () => {
    const footer = { showDefaultFooter: true, confirmText: 'Confirm', cancelText: 'Cancel' }

    it('keeps the primary confirm by default', () => {
      const wrapper = mountModal(footer)
      const confirm = wrapper.find('.base-modal-footer .btn')
      expect(confirm.text()).toBe('Confirm')
      expect(confirm.classes()).toContain('btn-primary')
      expect(confirm.classes()).not.toContain('btn-danger')
    })

    it('renders a danger confirm with the shared danger button class', () => {
      const wrapper = mountModal({ ...footer, confirmVariant: 'danger' })
      const confirm = wrapper.find('.base-modal-footer .btn')
      expect(confirm.text()).toBe('Confirm')
      expect(confirm.classes()).toEqual(expect.arrayContaining(['btn', 'btn-danger']))
      expect(confirm.classes()).not.toContain('btn-primary')
    })

    it('puts the test ids on the default footer buttons', async () => {
      const wrapper = mountModal({ ...footer, confirmTestId: 'my-confirm', cancelTestId: 'my-cancel' })

      const confirm = wrapper.find('[data-testid="my-confirm"]')
      const cancel = wrapper.find('[data-testid="my-cancel"]')
      expect(confirm.exists()).toBe(true)
      expect(confirm.element.tagName).toBe('BUTTON')
      expect(confirm.text()).toBe('Confirm')
      expect(cancel.element.tagName).toBe('BUTTON')
      expect(cancel.text()).toBe('Cancel')

      await confirm.trigger('click')
      await cancel.trigger('click')
      expect(wrapper.emitted('confirm')).toHaveLength(1)
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('sets no test id when none is given', () => {
      const wrapper = mountModal(footer)
      expect(wrapper.find('.base-modal-footer [data-testid]').exists()).toBe(false)
    })
  })

  describe('slots', () => {
    it('renders default slot content', () => {
      const wrapper = mountModal({}, { default: '<p class="custom-content">Hello World</p>' })
      expect(wrapper.find('.custom-content').exists()).toBe(true)
      expect(wrapper.find('.custom-content').text()).toBe('Hello World')
    })

    it('renders header slot content', () => {
      const wrapper = mountModal({}, { header: '<h3 class="custom-header">Custom Header</h3>' })
      expect(wrapper.find('.base-modal-header').exists()).toBe(true)
      expect(wrapper.find('.custom-header').exists()).toBe(true)
    })

    it('renders footer slot content', () => {
      const wrapper = mountModal({}, { footer: '<div class="custom-footer">Custom Footer</div>' })
      expect(wrapper.find('.base-modal-footer').exists()).toBe(true)
      expect(wrapper.find('.custom-footer').exists()).toBe(true)
    })
  })

  describe('noPadding', () => {
    it('applies no-padding class when noPadding is true', () => {
      const wrapper = mountModal({ noPadding: true })
      expect(wrapper.find('.base-modal-container').classes()).toContain('base-modal-no-padding')
    })

    it('does not apply no-padding class by default', () => {
      const wrapper = mountModal()
      expect(wrapper.find('.base-modal-container').classes()).not.toContain('base-modal-no-padding')
    })
  })

  describe('content priority', () => {
    it('shows loading over success, error, and slot content', () => {
      const wrapper = mountModal(
        { isLoading: true, successMessage: 'Done', errorMessage: 'Fail' },
        { default: '<p>Content</p>' }
      )
      expect(wrapper.find('.base-modal-loading').exists()).toBe(true)
      expect(wrapper.find('.alert-success').exists()).toBe(false)
      expect(wrapper.find('.alert-danger').exists()).toBe(false)
    })

    it('shows success over error and slot content (when not loading)', () => {
      const wrapper = mountModal(
        { successMessage: 'Done', errorMessage: 'Fail' },
        { default: '<p>Content</p>' }
      )
      expect(wrapper.find('.alert-success').exists()).toBe(true)
      expect(wrapper.find('.alert-danger').exists()).toBe(false)
    })
  })

  describe('dialog semantics', () => {
    it('exposes the container as a modal dialog', () => {
      const wrapper = mountModal()
      const dialog = wrapper.find('.base-modal-container')
      expect(dialog.attributes('role')).toBe('dialog')
      expect(dialog.attributes('aria-modal')).toBe('true')
    })

    it('labels the dialog with the rendered title', () => {
      const wrapper = mountModal({ title: 'Delete member' })
      const labelledBy = wrapper.find('.base-modal-container').attributes('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      const label = wrapper.find(`[id="${labelledBy}"]`)
      expect(label.exists()).toBe(true)
      expect(label.text()).toContain('Delete member')
    })

    it('sets no aria-labelledby when there is no title', () => {
      const wrapper = mountModal({}, { header: '<h3>Custom</h3>' })
      expect(wrapper.find('.base-modal-container').attributes()).not.toHaveProperty('aria-labelledby')
    })
  })

  describe('keyboard and focus', () => {
    let opener: HTMLButtonElement

    function pressEscape() {
      // Bubbles from wherever focus is, so it reaches a container or a document listener.
      const target = (document.activeElement as HTMLElement | null) ?? document.body
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    }

    beforeEach(() => {
      document.body.innerHTML = ''
      opener = document.createElement('button')
      opener.textContent = 'open'
      document.body.appendChild(opener)
      opener.focus()
    })

    function mountAttached(props: Record<string, unknown> = {}) {
      return mount(BaseModal, {
        props: { visible: false, ...props },
        slots: { default: '<input class="inside-input" />' },
        attachTo: document.body,
        global: { plugins: [createTestI18n()] }
      })
    }

    it('emits close on Escape, like the close button', async () => {
      const wrapper = mountAttached({ visible: true })
      await nextTick()
      pressEscape()
      await nextTick()
      expect(wrapper.emitted('close')).toHaveLength(1)
      expect(wrapper.emitted('confirm')).toBeUndefined()
      wrapper.unmount()
    })

    it('ignores Escape while loading', async () => {
      const wrapper = mountAttached({ visible: true, isLoading: true })
      await nextTick()
      pressEscape()
      await nextTick()
      expect(wrapper.emitted('close')).toBeUndefined()
      wrapper.unmount()
    })

    it('ignores Escape when closeOnOverlayClick is false, to protect unsaved edits', async () => {
      const wrapper = mountAttached({ visible: true, closeOnOverlayClick: false })
      await nextTick()
      expect(wrapper.find('.base-modal-container').element.contains(document.activeElement)).toBe(true)
      pressEscape()
      await nextTick()
      expect(wrapper.emitted('close')).toBeUndefined()
      wrapper.unmount()
    })

    it('focuses an [autofocus] child, and leaves a caller-focused input alone', async () => {
      const wrapper = mount(BaseModal, {
        props: { visible: false },
        slots: { default: '<input class="first" /><input class="auto" autofocus />' },
        attachTo: document.body,
        global: { plugins: [createTestI18n()] }
      })
      await wrapper.setProps({ visible: true })
      expect(document.activeElement).toBe(wrapper.find('.auto').element)

      // A caller that focuses its own field after open (await nextTick(); el.focus()) keeps it.
      const first = wrapper.find('.first').element as HTMLInputElement
      first.focus()
      await nextTick()
      await nextTick()
      expect(document.activeElement).toBe(first)
      wrapper.unmount()
    })

    it('returns focus to the opener when a parent v-if removes the open modal, and tolerates a removed opener', async () => {
      const show = ref(false)
      const Host = defineComponent({
        setup() {
          return () => show.value ? h(BaseModal, { visible: true, title: 'T' }, () => h('input')) : null
        }
      })
      const wrapper = mount(Host, { attachTo: document.body, global: { plugins: [createTestI18n()] } })
      show.value = true
      await nextTick()
      await nextTick()
      expect(document.querySelector('.base-modal-container')!.contains(document.activeElement)).toBe(true)
      show.value = false
      await nextTick()
      expect(document.activeElement).toBe(opener)

      show.value = true
      await nextTick()
      await nextTick()
      opener.remove()
      show.value = false
      await nextTick()
      expect(document.querySelector('.base-modal-container')).toBeNull()
      wrapper.unmount()
    })

    it('ignores Escape when hidden', async () => {
      const wrapper = mountAttached({ visible: false })
      pressEscape()
      await nextTick()
      expect(wrapper.emitted('close')).toBeUndefined()
      wrapper.unmount()
    })

    it('moves focus inside on open and returns it to the opener on close', async () => {
      const wrapper = mountAttached({ visible: false })
      expect(document.activeElement).toBe(opener)

      await wrapper.setProps({ visible: true })
      await nextTick()
      const container = wrapper.find('.base-modal-container').element
      expect(container.contains(document.activeElement)).toBe(true)

      await wrapper.setProps({ visible: false })
      await nextTick()
      expect(document.activeElement).toBe(opener)
      wrapper.unmount()
    })

    it('closes only the top modal when two are open', async () => {
      // Mirrors ScenarioEditModal: a confirm BaseModal opens over the edit BaseModal.
      const bottomClosed = vi.fn()
      const topClosed = vi.fn()
      const showTop = ref(false)
      const Host = defineComponent({
        setup() {
          return () => [
            h(BaseModal, { visible: true, title: 'Bottom', onClose: bottomClosed }, () => h('input')),
            h(BaseModal, { visible: showTop.value, title: 'Top', onClose: topClosed }, () => h('p', 'sure?'))
          ]
        }
      })
      const wrapper = mount(Host, { attachTo: document.body, global: { plugins: [createTestI18n()] } })
      await nextTick()
      showTop.value = true
      await nextTick()
      await nextTick()

      pressEscape()
      await nextTick()
      expect(topClosed).toHaveBeenCalledTimes(1)
      expect(bottomClosed).not.toHaveBeenCalled()
      wrapper.unmount()
    })
  })

  describe('translated fallbacks', () => {
    function mountIn(locale: string, props: Record<string, unknown> = {}) {
      return mount(BaseModal, {
        props: { visible: true, ...props },
        global: { plugins: [createTestI18n(locale)] }
      })
    }

    it('labels the close button in French', () => {
      expect(mountIn('fr').find('.base-modal-close').attributes('aria-label')).toBe('Fermer')
    })

    it('labels the close button in English', () => {
      expect(mountIn('en').find('.base-modal-close').attributes('aria-label')).toBe('Close')
    })

    it('shows the default loading text in French', () => {
      expect(mountIn('fr', { isLoading: true }).find('.base-modal-loading').text()).toBe('Chargement...')
    })

    it('shows the default loading text in English', () => {
      expect(mountIn('en', { isLoading: true }).find('.base-modal-loading').text()).toBe('Loading...')
    })
  })
})
