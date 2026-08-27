import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import i18n from '../i18n'

/**
 * Composable for showing user notifications and modals using Element Plus
 * Replaces browser alerts with proper UI components from the design system
 *
 * Translated through the global i18n instance rather than useTranslations(),
 * because these helpers are also called outside of a component setup context.
 */
export function useNotification() {

  const t = (key: string) => i18n.global.t(`notification.${key}`)

  /**
   * Show a success message notification
   */
  const showSuccess = (message: string, title?: string) => {
    ElNotification({
      title: title ?? t('successTitle'),
      message,
      type: 'success',
      duration: 3000,
    })
  }

  /**
   * Show an error message notification
   */
  const showError = (message: string, title?: string) => {
    ElNotification({
      title: title ?? t('errorTitle'),
      message,
      type: 'error',
      duration: 4000,
    })
  }

  /**
   * Show a warning message notification
   */
  const showWarning = (message: string, title?: string) => {
    ElNotification({
      title: title ?? t('warningTitle'),
      message,
      type: 'warning',
      duration: 3500,
    })
  }

  /**
   * Show an info message notification
   */
  const showInfo = (message: string, title?: string) => {
    ElNotification({
      title: title ?? t('infoTitle'),
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
  const showAlert = async (message: string, title?: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    try {
      await ElMessageBox.alert(message, title ?? t('alertTitle'), {
        confirmButtonText: t('ok'),
        type,
        center: true,
      })
    } catch (error) {
    }
  }

  /**
   * Show a confirm dialog
   */
  const showConfirm = async (
    message: string,
    title?: string,
    options: {
      confirmButtonText?: string
      cancelButtonText?: string
      type?: 'info' | 'warning' | 'error' | 'success'
    } = {}
  ): Promise<boolean> => {
    try {
      await ElMessageBox.confirm(message, title ?? t('confirmTitle'), {
        confirmButtonText: options.confirmButtonText || t('confirm'),
        cancelButtonText: options.cancelButtonText || t('cancel'),
        type: options.type || 'warning',
        center: true,
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Show a prompt dialog for user input
   */
  const showPrompt = async (
    message: string,
    title?: string,
    options: {
      inputPlaceholder?: string
      inputPattern?: RegExp
      inputErrorMessage?: string
    } = {}
  ): Promise<string | null> => {
    try {
      const result = await ElMessageBox.prompt(message, title ?? t('promptTitle'), {
        confirmButtonText: t('ok'),
        cancelButtonText: t('cancel'),
        inputPlaceholder: options.inputPlaceholder,
        inputPattern: options.inputPattern,
        inputErrorMessage: options.inputErrorMessage,
        center: true,
      })
      return (result as { value: string }).value
    } catch (error) {
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
