import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useToast } from '../../src/composables/useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Clear all toasts before each test
    const { toasts } = useToast()
    toasts.value.splice(0, toasts.value.length)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('show', () => {
    it('adds a toast to the list', () => {
      const { show, toasts } = useToast()
      show('Hello world', 'info')
      expect(toasts.value.length).toBe(1)
      expect(toasts.value[0].message).toBe('Hello world')
      expect(toasts.value[0].type).toBe('info')
    })

    it('returns a unique toast id', () => {
      const { show } = useToast()
      const id1 = show('Toast 1')
      const id2 = show('Toast 2')
      expect(id1).not.toBe(id2)
    })

    it('defaults to info type', () => {
      const { show, toasts } = useToast()
      show('Default type')
      expect(toasts.value[0].type).toBe('info')
    })

    it('auto-removes toast after duration', () => {
      const { show, toasts } = useToast()
      show('Temporary', 'info', 3000)
      expect(toasts.value.length).toBe(1)

      vi.advanceTimersByTime(3000)
      expect(toasts.value.length).toBe(0)
    })

    it('does not remove toast before duration expires', () => {
      const { show, toasts } = useToast()
      show('Temporary', 'info', 3000)

      vi.advanceTimersByTime(2999)
      expect(toasts.value.length).toBe(1)
    })

    it('stores the duration on the toast object', () => {
      const { show, toasts } = useToast()
      show('With duration', 'info', 5000)
      expect(toasts.value[0].duration).toBe(5000)
    })
  })

  describe('remove', () => {
    it('removes a specific toast by id', () => {
      const { show, remove, toasts } = useToast()
      const id1 = show('Toast 1')
      show('Toast 2')
      expect(toasts.value.length).toBe(2)

      remove(id1)
      expect(toasts.value.length).toBe(1)
      expect(toasts.value[0].message).toBe('Toast 2')
    })

    it('does nothing if id is not found', () => {
      const { show, remove, toasts } = useToast()
      show('Toast 1')
      const initialLength = toasts.value.length

      remove(99999)
      expect(toasts.value.length).toBe(initialLength)
    })
  })

  describe('convenience methods', () => {
    it('success() creates a toast with success type', () => {
      const { success, toasts } = useToast()
      success('Operation succeeded')
      const toast = toasts.value[toasts.value.length - 1]
      expect(toast.type).toBe('success')
      expect(toast.message).toBe('Operation succeeded')
    })

    it('error() creates a toast with error type', () => {
      const { error, toasts } = useToast()
      error('Something went wrong')
      const toast = toasts.value[toasts.value.length - 1]
      expect(toast.type).toBe('error')
      expect(toast.message).toBe('Something went wrong')
    })

    it('info() creates a toast with info type', () => {
      const { info, toasts } = useToast()
      info('FYI')
      const toast = toasts.value[toasts.value.length - 1]
      expect(toast.type).toBe('info')
      expect(toast.message).toBe('FYI')
    })

    it('warning() creates a toast with warning type', () => {
      const { warning, toasts } = useToast()
      warning('Be careful')
      const toast = toasts.value[toasts.value.length - 1]
      expect(toast.type).toBe('warning')
      expect(toast.message).toBe('Be careful')
    })

    it('error() uses 4000ms default duration', () => {
      const { error, toasts } = useToast()
      error('Error message')
      const toast = toasts.value[toasts.value.length - 1]
      expect(toast.duration).toBe(4000)
    })

    it('success() uses 3000ms default duration', () => {
      const { success, toasts } = useToast()
      success('Success message')
      const toast = toasts.value[toasts.value.length - 1]
      expect(toast.duration).toBe(3000)
    })

    it('convenience methods accept custom duration', () => {
      const { success, toasts } = useToast()
      success('Custom duration', 10000)
      const toast = toasts.value[toasts.value.length - 1]
      expect(toast.duration).toBe(10000)
    })
  })

  describe('multiple toasts', () => {
    it('can manage multiple toasts simultaneously', () => {
      const { show, toasts } = useToast()
      show('Toast 1', 'info', 1000)
      show('Toast 2', 'success', 2000)
      show('Toast 3', 'error', 3000)
      expect(toasts.value.length).toBe(3)

      vi.advanceTimersByTime(1000)
      expect(toasts.value.length).toBe(2)

      vi.advanceTimersByTime(1000)
      expect(toasts.value.length).toBe(1)

      vi.advanceTimersByTime(1000)
      expect(toasts.value.length).toBe(0)
    })
  })
})
