// Exports centralisés des composants Dashboard
export { default as NoSubscriptionCard } from './NoSubscriptionCard.vue'
export { default as RecentInvoices } from './RecentInvoices.vue'
export { default as AllSubscriptions } from './AllSubscriptions.vue'
export { default as ActiveSubscriptionSource } from './ActiveSubscriptionSource.vue'

// Types utilitaires si nécessaire
export interface DashboardProps {
  subscription: any | null
  hasActiveSubscription: boolean
  recentInvoices: any[]
  isLoading?: boolean
}

export interface RecentInvoicesEmits {
  downloadInvoice: [invoiceId: string]
}