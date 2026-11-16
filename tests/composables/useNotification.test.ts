/**
 * useNotification is the single entry point for user feedback. Its toasts
 * render through the house toast (useToast + ToastContainer); confirm dialogs
 * still go through Element Plus ElMessageBox.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const { ElNotification, confirmMock } = vi.hoisted(() => ({
  ElNotification: vi.fn(),
  confirmMock: vi.fn(),
}))
vi.mock('element-plus', () => ({
  ElNotification,
  ElMessage: vi.fn(),
  ElMessageBox: { confirm: confirmMock, alert: vi.fn(), prompt: vi.fn() },
}))

import i18n from '../../src/i18n'
import { useNotification } from '../../src/composables/useNotification'
import { useToast } from '../../src/composables/useToast'

const { toasts } = useToast()

describe('useNotification — toasts go through the house toast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    toasts.value.splice(0)
    i18n.global.locale.value = 'en'
  })

  it.each([
    ['showSuccess', 'success', 'Success', 3000],
    ['showError', 'error', 'Error', 4000],
    ['showWarning', 'warning', 'Warning', 3500],
    ['showInfo', 'info', 'Info', 3000],
  ] as const)('%s pushes one %s toast with the default title', (fn, type, title, duration) => {
    useNotification()[fn]('Saved the thing')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({ type, message: 'Saved the thing', title, duration })
    expect(ElNotification).not.toHaveBeenCalled()
  })

  it('keeps the caller title', () => {
    useNotification().showError('Permission denied', 'Unable to upgrade')

    expect(toasts.value[0]).toMatchObject({ type: 'error', message: 'Permission denied', title: 'Unable to upgrade' })
  })

  it('translates the default title', () => {
    i18n.global.locale.value = 'fr'
    useNotification().showError('Oups')

    expect(toasts.value[0]).toMatchObject({ title: 'Erreur' })
  })

  it('can keep a toast on screen until it is closed', () => {
    useNotification().showError('Subgroups TD 2 were not created', 'Subgroups', { persistent: true })

    expect(toasts.value[0]).toMatchObject({ type: 'error', persistent: true })
  })
})

describe('useNotification — showConfirm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves true when the user confirms', async () => {
    confirmMock.mockResolvedValueOnce('confirm')
    await expect(useNotification().showConfirm('Delete?')).resolves.toBe(true)
    expect(confirmMock).toHaveBeenCalledWith('Delete?', expect.any(String), expect.any(Object))
  })

  it('resolves false when the user cancels', async () => {
    confirmMock.mockRejectedValueOnce('cancel')
    await expect(useNotification().showConfirm('Delete?')).resolves.toBe(false)
  })
})
