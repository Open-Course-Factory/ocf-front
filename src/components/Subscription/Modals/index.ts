// Exports centralisés des modals Subscription
export { default as CancelSubscriptionModal } from './CancelSubscriptionModal.vue'
export { default as ReactivateModal } from './ReactivateModal.vue'

// Types pour les props des modals
export interface CancelModalProps {
  visible: boolean
  isConfirming?: boolean
}

export interface ReactivateModalProps {
  visible: boolean
  subscription?: any | null
  isConfirming?: boolean
}

export interface CancelModalEmits {
  close: []
  confirm: [cancelImmediately: boolean]
}

export interface ReactivateModalEmits {
  close: []
  confirm: []
}