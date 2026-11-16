/**
 * Destructive actions ask through the app confirm dialog (useNotification),
 * never through the browser's window.confirm.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key })
}))

const showConfirmMock = vi.fn()
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: (...args: any[]) => showConfirmMock(...args),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  })
}))

const emailStore = {
  entities: [{ id: 'tpl-1', name: 'welcome', display_name: 'Welcome', subject: 'Hi', is_active: true, is_system: false }],
  isLoading: false,
  error: null,
  t: (key: string) => key,
  loadTemplates: vi.fn().mockResolvedValue(undefined),
  deleteTemplate: vi.fn().mockResolvedValue(undefined),
}
vi.mock('../../src/stores/emailTemplates', () => ({
  useEmailTemplatesStore: () => emailStore,
}))

import axios from 'axios'
import EmailTemplates from '../../src/components/Pages/EmailTemplates.vue'
import InvoiceCleanup from '../../src/components/Pages/Admin/InvoiceCleanup.vue'
import VersionSelector from '../../src/components/Course/VersionSelector.vue'

const nativeConfirm = vi.fn(() => true)

beforeEach(() => {
  vi.clearAllMocks()
  showConfirmMock.mockResolvedValue(true)
  vi.stubGlobal('confirm', nativeConfirm)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('EmailTemplates — delete', () => {
  it('asks through the app confirm dialog, then deletes', async () => {
    const wrapper = mount(EmailTemplates, { global: { stubs: { BaseModal: true } } })
    await flushPromises()

    await wrapper.find('.btn-danger').trigger('click')
    await flushPromises()

    expect(nativeConfirm).not.toHaveBeenCalled()
    expect(showConfirmMock).toHaveBeenCalledWith('emailTemplates.deleteConfirm')
    expect(emailStore.deleteTemplate).toHaveBeenCalledWith('tpl-1', false)
  })
})

describe('InvoiceCleanup — execute selected', () => {
  it('asks through the app confirm dialog, then runs the real cleanup', async () => {
    ;(axios.post as any).mockResolvedValue({
      data: {
        dry_run: true,
        currency: 'eur',
        total_amount_cleaned: 1000,
        cleaned_details: [{ invoice_id: 'in_1', amount: 1000, currency: 'eur', status: 'open', created_at: '2026-01-01' }],
      }
    })
    const wrapper = mount(InvoiceCleanup)

    await wrapper.find('.btn-primary').trigger('click')
    await flushPromises()
    await wrapper.find('td.checkbox-column input').setValue(true)
    await wrapper.find('.btn-danger').trigger('click')
    await flushPromises()

    expect(nativeConfirm).not.toHaveBeenCalled()
    expect(showConfirmMock).toHaveBeenCalledWith(expect.stringContaining('invoiceCleanup.confirmExecution'))
    expect((axios.post as any).mock.calls.at(-1)[1]).toMatchObject({ invoice_ids: ['in_1'], dry_run: false })
  })
})

describe('VersionSelector — delete version', () => {
  it('asks through the app confirm dialog, then emits the deletion', async () => {
    const wrapper = mount(VersionSelector, {
      props: {
        versions: [
          { id: 'c2', version: '2.0', updated_at: '2026-02-01' },
          { id: 'c1', version: '1.0', updated_at: '2026-01-01' },
        ] as any,
        selectedVersion: '1.0',
      }
    })

    await wrapper.find('.btn-delete-version').trigger('click')
    await flushPromises()

    expect(nativeConfirm).not.toHaveBeenCalled()
    expect(showConfirmMock).toHaveBeenCalledWith('courses.confirmDeleteVersion')
    expect(wrapper.emitted('delete-version')).toEqual([['c1']])
  })
})
