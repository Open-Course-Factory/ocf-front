export * from './Dashboard'
export * from './Modals'

// Types globaux du module
export interface SubscriptionModuleConfig {
  enableUsageTracking?: boolean
  enableTrialMode?: boolean
  defaultCurrency?: string
}