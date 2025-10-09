/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */

import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  function show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 3000) {
    const id = nextId++
    const toast: Toast = { id, message, type, duration }

    toasts.value.push(toast)

    setTimeout(() => {
      remove(id)
    }, duration)

    return id
  }

  function remove(id: number) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
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
    success,
    error,
    info,
    warning
  }
}
