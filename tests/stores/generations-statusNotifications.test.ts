/**
 * A generation changing status tells the user through the house toast:
 * completion is a success toast, a failure stays on screen until closed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

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

vi.mock('element-plus', () => ({
  ElNotification: vi.fn()
}))

import axios from 'axios'
import { ElNotification } from 'element-plus'
import i18n from '../../src/i18n'
import { useGenerationsStore } from '../../src/stores/generations'
import { useToast } from '../../src/composables/useToast'

const { toasts } = useToast()

async function statusGoesFromProcessingTo(status: Record<string, any>) {
  const store = useGenerationsStore()
  ;(axios.get as any)
    .mockResolvedValueOnce({ status: 200, data: { status: 'processing' } })
    .mockResolvedValueOnce({ status: 200, data: status })
  await store.checkGenerationStatus('gen-1')
  await store.checkGenerationStatus('gen-1')
}

describe('generations — status change notifications', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    toasts.value.splice(0)
    i18n.global.locale.value = 'en'
  })

  it('shows a success toast when the generation completes', async () => {
    await statusGoesFromProcessingTo({ status: 'completed' })

    expect(ElNotification).not.toHaveBeenCalled()
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({ type: 'success' })
  })

  it('shows the worker error until the user closes it when the generation fails', async () => {
    await statusGoesFromProcessingTo({ status: 'failed', error_message: 'slidev exited with 1' })

    expect(ElNotification).not.toHaveBeenCalled()
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({ type: 'error', message: 'slidev exited with 1', persistent: true })
  })
})
