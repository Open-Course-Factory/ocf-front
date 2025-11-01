// Exports centralisés des composants Dashboard
export { default as SubscriptionCard } from './SubscriptionCard.vue'
export { default as UsageOverview } from './UsageOverview.vue'
export { default as RecentInvoices } from './RecentInvoices.vue'
export { default as AllSubscriptions } from './AllSubscriptions.vue'
export { default as ActiveSubscriptionSource } from './ActiveSubscriptionSource.vue'

// Types utilitaires si nécessaire
export interface DashboardProps {
  subscription: any | null
  hasActiveSubscription: boolean
  usageMetrics: any[]
  recentInvoices: any[]
  isLoading?: boolean
}

export interface SubscriptionCardEmits {
  manage: []
  cancel: []
  reactivate: []
}

export interface UsageOverviewEmits {
  refresh: []
}

export interface RecentInvoicesEmits {
  downloadInvoice: [invoiceId: string]
}