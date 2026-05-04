import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// Mock axios before component imports
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

import axios from 'axios'

// Mock useNotification so we can spy on the warning channel
const showSuccess = vi.fn()
const showError = vi.fn()
const showWarning = vi.fn()
const showInfo = vi.fn()

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showSuccess,
    showError,
    showWarning,
    showInfo
  })
}))

import GroupCommandHistory from '../../src/components/Groups/GroupCommandHistory.vue'

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

function mountComponent(propsOverrides: Record<string, unknown> = {}) {
  const i18n = createTestI18n()
  setActivePinia(createPinia())

  return mount(GroupCommandHistory, {
    props: {
      groupId: 'test-group-id',
      ...propsOverrides
    },
    global: {
      plugins: [i18n],
      stubs: {
        RouterLink: {
          template: '<a class="router-link-stub"><slot /></a>',
          props: ['to']
        }
      }
    }
  })
}

// Helper: flush all pending microtasks/promises
async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
}

// Stub URL.createObjectURL / revokeObjectURL for happy-dom
beforeEach(() => {
  showSuccess.mockClear()
  showError.mockClear()
  showWarning.mockClear()
  showInfo.mockClear()
  ;(axios as any).get.mockReset()
  ;(axios as any).post.mockReset()
  ;(axios as any).patch.mockReset()
  ;(axios as any).delete.mockReset()

  if (!(globalThis.URL as any).createObjectURL) {
    ;(globalThis.URL as any).createObjectURL = () => 'blob:fake'
  } else {
    ;(globalThis.URL as any).createObjectURL = vi.fn(() => 'blob:fake')
  }
  if (!(globalThis.URL as any).revokeObjectURL) {
    ;(globalThis.URL as any).revokeObjectURL = () => {}
  } else {
    ;(globalThis.URL as any).revokeObjectURL = vi.fn()
  }
})

describe('GroupCommandHistory', () => {
  describe('export cap indicator', () => {
    it('renders an export-cap indicator near the Export CSV button', async () => {
      // Default empty data: just enough to render the toolbar
      ;(axios as any).get.mockImplementation((url: string) => {
        if (url.includes('command-history-stats')) {
          return Promise.resolve({
            data: {
              summary: {
                total_commands: 0,
                total_sessions: 0,
                active_students: 0,
                avg_commands_per_student: 0,
                avg_time_per_student_seconds: 0
              },
              students: []
            }
          })
        }
        if (url.includes('command-history')) {
          return Promise.resolve({
            data: { commands: [], total: 0, limit: 50, offset: 0 }
          })
        }
        return Promise.resolve({ data: {} })
      })

      const wrapper = mountComponent()
      await flushPromises()
      await flushPromises()

      const text = wrapper.text()
      // The cap value 100,000 (or 100000 / 100 000) should be visible
      expect(text).toMatch(/100[,.\s]?000/)
      // And the indicator should mention support / contact-support concept
      expect(text.toLowerCase()).toContain('support')
    })
  })

  describe('truncation warning when total > cap', () => {
    it('fires showWarning when total exceeds the export cap (100000)', async () => {
      ;(axios as any).get.mockImplementation((url: string, config?: any) => {
        if (url.includes('command-history-stats')) {
          return Promise.resolve({
            data: {
              summary: {
                total_commands: 150000,
                total_sessions: 10,
                active_students: 5,
                avg_commands_per_student: 30000,
                avg_time_per_student_seconds: 0
              },
              students: []
            }
          })
        }
        if (url.includes('command-history')) {
          // Distinguish JSON list call from CSV blob export call
          if (config?.responseType === 'blob') {
            return Promise.resolve({ data: new Blob([''], { type: 'text/csv' }) })
          }
          return Promise.resolve({
            data: { commands: [], total: 150000, limit: 50, offset: 0 }
          })
        }
        return Promise.resolve({ data: {} })
      })

      const wrapper = mountComponent()
      await flushPromises()
      await flushPromises()

      const buttons = wrapper.findAll('button')
      const exportBtn = buttons.find(
        b =>
          b.find('.fa-file-csv').exists() ||
          b.text().toLowerCase().includes('csv') ||
          b.text().toLowerCase().includes('export')
      )
      expect(exportBtn).toBeDefined()

      // The button is disabled when total === 0; here total is 150000, so it should be enabled.
      await exportBtn!.trigger('click')
      await flushPromises()
      await flushPromises()

      // The warning channel must have been called because total > cap.
      expect(showWarning).toHaveBeenCalled()
    })
  })

  describe('no truncation warning when total <= cap', () => {
    it('does NOT fire showWarning when total is within the cap', async () => {
      ;(axios as any).get.mockImplementation((url: string, config?: any) => {
        if (url.includes('command-history-stats')) {
          return Promise.resolve({
            data: {
              summary: {
                total_commands: 500,
                total_sessions: 1,
                active_students: 1,
                avg_commands_per_student: 500,
                avg_time_per_student_seconds: 0
              },
              students: []
            }
          })
        }
        if (url.includes('command-history')) {
          if (config?.responseType === 'blob') {
            return Promise.resolve({ data: new Blob([''], { type: 'text/csv' }) })
          }
          return Promise.resolve({
            data: {
              commands: [
                {
                  student_name: 'Alice',
                  student_email: 'alice@example.com',
                  session_uuid: 'u-1',
                  sequence_num: 1,
                  command_text: 'ls',
                  executed_at: 1234567890
                }
              ],
              total: 500,
              limit: 50,
              offset: 0
            }
          })
        }
        return Promise.resolve({ data: {} })
      })

      const wrapper = mountComponent()
      await flushPromises()
      await flushPromises()

      showWarning.mockClear()

      const buttons = wrapper.findAll('button')
      const exportBtn = buttons.find(
        b =>
          b.find('.fa-file-csv').exists() ||
          b.text().toLowerCase().includes('csv') ||
          b.text().toLowerCase().includes('export')
      )
      expect(exportBtn).toBeDefined()

      await exportBtn!.trigger('click')
      await flushPromises()
      await flushPromises()

      expect(showWarning).not.toHaveBeenCalled()
    })
  })
})
