/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import { ref } from 'vue'

interface ToastAction {
  label: string
  callback: () => void
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
  persistent: boolean
  action?: ToastAction
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  function show(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration = 3000,
    options?: { persistent?: boolean; action?: ToastAction }
  ) {
    const id = nextId++
    const persistent = options?.persistent ?? false
    const toast: Toast = { id, message, type, duration, persistent, action: options?.action }

    toasts.value.push(toast)

    if (!persistent) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  function remove(id: number) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  function update(id: number, message: string) {
    const toast = toasts.value.find(t => t.id === id)
    if (toast) {
      toast.message = message
    }
  }

  function success(message: string, duration = 3000) {
    return show(message, 'success', duration)
  }

  function error(message: string, duration = 4000) {
    return show(message, 'error', duration)
  }

  function info(message: string, duration = 3000) {
    return show(message, 'info', duration)
  }

  function warning(message: string, duration = 3000) {
    return show(message, 'warning', duration)
  }

  return {
    toasts,
    show,
    remove,
    update,
    success,
    error,
    info,
    warning
  }
}
