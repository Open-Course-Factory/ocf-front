/**
 * The import page offers a "mark imported email addresses as verified"
 * checkbox next to the existing options. It is ticked by default — the
 * organization vouches for the addresses it imports — and unticking it is
 * what tells the store to let each learner confirm their own address.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: { id: 'org-1' }, query: {}, meta: {} }),
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
}))

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    organizations: [{ id: 'org-1', name: 'lycee', display_name: 'Lycée' }],
    loadOrganizations: vi.fn().mockResolvedValue(undefined),
  }),
}))

import BulkImport from '../../src/components/Pages/BulkImport.vue'
import { useBulkImportStore } from '../../src/stores/bulkImport'

const childStubs = {
  CSVFileUpload: true,
  CSVPreview: true,
  ValidationResults: true,
  ImportProgress: true,
}

async function mountPage() {
  const wrapper = mount(BulkImport, { global: { stubs: childStubs } })
  await flushPromises()
  return wrapper
}

function verifyCheckbox(wrapper: ReturnType<typeof mount>) {
  return wrapper.find('input[type="checkbox"][data-option="verify-emails"]')
}

describe('BulkImport page — verify imported emails checkbox', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows the option with its label and hint', async () => {
    const wrapper = await mountPage()

    expect(verifyCheckbox(wrapper).exists()).toBe(true)
    expect(wrapper.text()).toContain('bulkImport.verifyEmailsLabel')
    expect(wrapper.text()).toContain('bulkImport.verifyEmailsHint')
  })

  it('is ticked by default', async () => {
    const wrapper = await mountPage()

    expect((verifyCheckbox(wrapper).element as HTMLInputElement).checked).toBe(true)
  })

  it('unticking it turns the store option off', async () => {
    const wrapper = await mountPage()
    const store = useBulkImportStore()

    await verifyCheckbox(wrapper).setValue(false)

    expect(store.verifyEmails).toBe(false)
  })
})
