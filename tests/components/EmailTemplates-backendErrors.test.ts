import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

/*
 * The email-template pages show the sentence the backend gives ({ error_message }),
 * and a translated fallback when axios fails without one, never axios' own text.
 */

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}))

vi.mock('../../src/services/demo', () => ({
  isDemoMode: () => false,
  logDemoAction: vi.fn(),
  simulateDelay: () => Promise.resolve(),
}))

const showError = vi.fn()
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showError, showSuccess: vi.fn() }),
}))

const route = { params: {} as Record<string, string> }
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push: vi.fn() }),
}))

import axios from 'axios'
import i18n from '../../src/i18n'
import { useEmailTemplatesStore } from '../../src/stores/emailTemplates'
import EmailTemplates from '../../src/components/Pages/EmailTemplates.vue'
import EmailTemplateEditor from '../../src/components/Pages/EmailTemplateEditor.vue'

const mockGet = vi.mocked(axios.get)
const mockPost = vi.mocked(axios.post)
const mockPatch = vi.mocked(axios.patch)
const mockDelete = vi.mocked(axios.delete)

const backendRefusal = {
  isAxiosError: true,
  response: { status: 400, data: { error_code: 400, error_message: 'X' } },
  message: 'Request failed with status code 400',
}
const networkError = { isAxiosError: true, request: {}, message: 'Network Error' }
const template = {
  id: 'tpl1', name: 'welcome', display_name: 'Welcome', description: '',
  subject: 'Hi', html_body: '<p>Hi</p>', variables: '[]', is_system: false, is_active: true,
}

const BaseModalStub = {
  template: '<div><slot /><button class="stub-confirm" @click="$emit(\'confirm\')" /></div>',
}

function setLocale(locale: 'en' | 'fr') {
  ;(i18n.global.locale as any).value = locale
}

async function mountListWith(entities: any[]) {
  const wrapper = mount(EmailTemplates, {
    global: { plugins: [i18n], stubs: { BaseModal: BaseModalStub } },
  })
  await flushPromises()
  useEmailTemplatesStore().entities = entities
  await nextTick()
  return wrapper
}

async function mountEditor() {
  const wrapper = mount(EmailTemplateEditor, {
    global: { plugins: [i18n], stubs: { VariablesEditor: true, EmailPreview: true } },
  })
  await flushPromises()
  return wrapper
}

async function deleteFirst(wrapper: any) {
  await wrapper.findAll('.template-card button').at(-1)!.trigger('click')
  await flushPromises()
}

async function saveEditor(wrapper: any) {
  await wrapper.find('.toolbar-right .btn-primary').trigger('click')
  await flushPromises()
}

const lastError = () => showError.mock.calls.at(-1)?.[0]
const RAW_KEY = /^[\w-]+(\.[\w-]+)+$/

/*
 * A bodiless failure shows a sentence in the reader's language: never axios' text,
 * never a raw key, and a French reader does not get the English one.
 */
async function expectTranslatedFallback(fail: () => Promise<void>) {
  setLocale('en')
  await fail()
  const en = lastError()
  setLocale('fr')
  await fail()
  const fr = lastError()
  setLocale('en')
  for (const msg of [en, fr]) {
    expect(msg).toBeTruthy()
    expect(msg).not.toBe('Network Error')
    expect(msg).not.toMatch(RAW_KEY)
  }
  expect(fr, 'fr fallback must differ from the en one').not.toBe(en)
}

describe('EmailTemplates page errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    setLocale('en')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('confirm', () => true)
    mockGet.mockResolvedValue({ data: [] })
    route.params = {}
  })

  it('load shows the backend error_message', async () => {
    mockGet.mockRejectedValue(backendRefusal)
    await mountListWith([])
    expect(showError).toHaveBeenCalledWith('X')
  })

  it('load shows its translated fallback on a network error, not axios text', async () => {
    mockGet.mockRejectedValue(networkError)
    await mountListWith([])
    expect(showError).toHaveBeenCalledWith('Failed to load email templates')
  })

  it('delete shows the backend error_message', async () => {
    mockDelete.mockRejectedValue(backendRefusal)
    const wrapper = await mountListWith([template])
    await deleteFirst(wrapper)
    expect(mockDelete).toHaveBeenCalled()
    expect(showError).toHaveBeenCalledWith('X')
  })

  it('delete falls back to a translated sentence in both locales', async () => {
    mockDelete.mockRejectedValue(networkError)
    await expectTranslatedFallback(async () => {
      setActivePinia(createPinia())
      await deleteFirst(await mountListWith([template]))
    })
  })

  it('test email shows the backend error_message', async () => {
    mockPost.mockRejectedValue(backendRefusal)
    const wrapper = await mountListWith([template])
    await wrapper.findAll('.template-card button')[1].trigger('click')
    await wrapper.find('#test-email').setValue('a@b.c')
    await wrapper.find('.stub-confirm').trigger('click')
    await flushPromises()
    expect(mockPost).toHaveBeenCalledWith('/email-templates/tpl1/test', { email: 'a@b.c' })
    expect(showError).toHaveBeenCalledWith('X')
  })
})

describe('EmailTemplateEditor page errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    setLocale('en')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    route.params = { id: 'tpl1' }
    mockGet.mockResolvedValue({ data: template })
  })

  it('load shows the backend error_message', async () => {
    mockGet.mockRejectedValue(backendRefusal)
    await mountEditor()
    expect(showError).toHaveBeenCalledWith('X')
  })

  it('load falls back to a translated sentence in both locales', async () => {
    mockGet.mockRejectedValue(networkError)
    await expectTranslatedFallback(async () => {
      await mountEditor()
    })
  })

  it('save shows the backend error_message', async () => {
    mockPatch.mockRejectedValue(backendRefusal)
    await saveEditor(await mountEditor())
    expect(mockPatch).toHaveBeenCalled()
    expect(showError).toHaveBeenCalledWith('X')
  })

  it('save falls back to a translated sentence in both locales', async () => {
    mockPatch.mockRejectedValue(networkError)
    await expectTranslatedFallback(async () => {
      await saveEditor(await mountEditor())
    })
  })
})
