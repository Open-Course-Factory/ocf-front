import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import BaseModal from '../../src/components/Modals/BaseModal.vue'

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
})
