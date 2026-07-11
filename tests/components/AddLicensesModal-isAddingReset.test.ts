/**
 * RED — AddLicensesModal leaves the submit state stuck when the parent persist
 * fails (#268 behavior fix).
 *
 * The modal owns `isAdding` and delegates persistence via `emit('added', qty)`.
 * On confirm it sets isAdding=true and hands off to the parent. The parent
 * (LicenseManagementDashboard.handleAddLicenses) awaits the store call and, on
 * failure, only shows an error toast — it does NOT close the modal. The modal
 * has no way to learn about the failure, so `isAdding` stays true forever:
 * `isAdding` is passed to BaseModal as `is-loading`, which replaces the whole
 * body with a permanent spinner and hides the close button. The modal is stuck.
 *
 * Proposed minimal contract: the modal exposes `resetSubmitting()` via
 * defineExpose so the parent can clear the submit state in its catch block
 * (keeping the entered quantity so the user can retry). This test drives the
 * modal into the submitting state and asserts the exposed reset restores it.
 *
 * Uses the REAL BaseModal so the is-loading -> spinner behavior is exercised.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: (messages: any) => {
    const flat: Record<string, string> = {}
    function flatten(obj: any, prefix: string) {
      for (const key of Object.keys(obj || {})) {
        const val = obj[key]
        const path = prefix ? `${prefix}.${key}` : key
        if (typeof val === 'string') flat[path] = val
        else if (val && typeof val === 'object') flatten(val, path)
      }
    }
    if (messages?.en) flatten(messages.en, '')
    return { t: (key: string) => flat[key] || key, te: () => true, locale: { value: 'en' } }
  },
}))

import AddLicensesModal from '../../src/components/Modals/AddLicensesModal.vue'

const batch: any = { id: 'batch-1', total_quantity: 5, subscription_plan: { name: 'Team' } }

async function mountOpen() {
  const wrapper = mount(AddLicensesModal, {
    props: { visible: false, batch },
  })
  // The visible false->true watcher seeds newQuantity (> total_quantity).
  await wrapper.setProps({ visible: true })
  await nextTick()
  return wrapper
}

describe('AddLicensesModal — submit state recovery after parent failure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('drives into the submitting state on confirm', async () => {
    const wrapper = await mountOpen()

    // Confirm is the BaseModal default-footer primary button.
    await wrapper.find('.base-modal-footer .btn-primary').trigger('click')
    await nextTick()

    // is-loading (isAdding) now replaces the body with the spinner.
    expect(wrapper.find('.base-modal-loading').exists()).toBe(true)
  })

  it('exposes resetSubmitting() so the parent can clear the stuck spinner on failure', async () => {
    const wrapper = await mountOpen()

    await wrapper.find('.base-modal-footer .btn-primary').trigger('click')
    await nextTick()
    expect(wrapper.find('.base-modal-loading').exists()).toBe(true)

    // Parent persist rejected -> parent asks the modal to reset its submit state.
    const resetSubmitting = (wrapper.vm as any).resetSubmitting
    expect(typeof resetSubmitting).toBe('function')

    resetSubmitting()
    await nextTick()

    // Spinner cleared, form body restored -> the user can retry.
    expect(wrapper.find('.base-modal-loading').exists()).toBe(false)
    expect(wrapper.find('.add-licenses-content').exists()).toBe(true)
    // The entered quantity is preserved so the retry keeps their input.
    expect((wrapper.find('#new-quantity').element as HTMLInputElement).value).toBe('15')
  })
})
