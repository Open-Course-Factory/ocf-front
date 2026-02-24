/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

/**
 * Composable for showing user notifications and modals using Element Plus
 * Replaces browser alerts with proper UI components from the design system
 */
export function useNotification() {

  /**
   * Show a success message notification
   */
  const showSuccess = (message: string, title = 'Success') => {
    ElNotification({
      title,
      message,
      type: 'success',
      duration: 3000,
    })
  }

  /**
   * Show an error message notification
   */
  const showError = (message: string, title = 'Error') => {
    ElNotification({
      title,
      message,
      type: 'error',
      duration: 4000,
    })
  }

  /**
   * Show a warning message notification
   */
  const showWarning = (message: string, title = 'Warning') => {
    ElNotification({
      title,
      message,
      type: 'warning',
      duration: 3500,
    })
  }

  /**
   * Show an info message notification
   */
  const showInfo = (message: string, title = 'Info') => {
    ElNotification({
      title,
      message,
      type: 'info',
      duration: 3000,
    })
  }

  /**
   * Show a simple toast message (less intrusive than notification)
   */
  const showMessage = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    ElMessage({
      message,
      type,
      duration: 2500,
    })
  }

  /**
   * Show an alert modal (replaces window.alert)
   */
  const showAlert = async (message: string, title = 'Alert', type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    try {
      await ElMessageBox.alert(message, title, {
        confirmButtonText: 'OK',
        type,
        center: true,
      })
    } catch (error) {
      // User closed the dialog
    }
  }

  /**
   * Show a confirm dialog
   */
  const showConfirm = async (
    message: string,
    title = 'Confirm',
    options: {
      confirmButtonText?: string
      cancelButtonText?: string
      type?: 'info' | 'warning' | 'error' | 'success'
    } = {}
  ): Promise<boolean> => {
    try {
      await ElMessageBox.confirm(message, title, {
        confirmButtonText: options.confirmButtonText || 'Confirm',
        cancelButtonText: options.cancelButtonText || 'Cancel',
        type: options.type || 'warning',
        center: true,
      })
      return true
    } catch (error) {
      // User cancelled
      return false
    }
  }

  /**
   * Show a prompt dialog for user input
   */
  const showPrompt = async (
    message: string,
    title = 'Input',
    options: {
      inputPlaceholder?: string
      inputPattern?: RegExp
      inputErrorMessage?: string
    } = {}
  ): Promise<string | null> => {
    try {
      const result = await ElMessageBox.prompt(message, title, {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        inputPlaceholder: options.inputPlaceholder,
        inputPattern: options.inputPattern,
        inputErrorMessage: options.inputErrorMessage,
        center: true,
      })
      return (result as { value: string }).value
    } catch (error) {
      // User cancelled
      return null
    }
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showMessage,
    showAlert,
    showConfirm,
    showPrompt,
  }
}
