import { ElMessageBox } from 'element-plus'
// Element Plus is not installed globally: only the confirm box's own styles (input skipped, confirm shows none)
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-overlay.css'
import 'element-plus/theme-chalk/el-button.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import i18n from '../i18n'
import { useToast } from './useToast'

type ToastType = 'success' | 'error' | 'warning' | 'info'

/**
 * Single entry point for user feedback: toasts render through the house toast
 * (useToast + ToastContainer), confirm dialogs through Element Plus ElMessageBox.
 *
 * Translated through the global i18n instance rather than useTranslations(),
 * because these helpers are also called outside of a component setup context.
 */
export function useNotification() {

  const t = (key: string) => i18n.global.t(`notification.${key}`)
  const toast = useToast()

  const notify = (type: ToastType, duration: number) =>
    (message: string, title?: string, options: { persistent?: boolean } = {}) => {
      toast.show(message, type, duration, { title: title ?? t(`${type}Title`), persistent: options.persistent })
    }

  const showSuccess = notify('success', 3000)
  const showError = notify('error', 4000)
  const showWarning = notify('warning', 3500)
  const showInfo = notify('info', 3000)

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

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  }
}
