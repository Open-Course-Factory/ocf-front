// src/components/Subscription/composables/useSubscriptionTranslations.ts
import { useI18n } from 'vue-i18n'

// Import direct et synchrone des stores pour s'assurer que les traductions sont chargées
import { useSubscriptionsStore } from '../../../stores/subscriptions'
import { useUsageMetricsStore } from '../../../stores/usageMetrics' 
import { useInvoicesStore } from '../../../stores/invoices'
import { useSubscriptionPlansStore } from '../../../stores/subscriptionPlans'

// Variable pour éviter les multiples initialisations
let translationsLoaded = false

/**
 * Composable qui assure que les traductions du domaine Subscription sont chargées
 */
export function useSubscriptionTranslations() {
  const { t } = useI18n()
  
  // Force le chargement des traductions au premier appel
  if (!translationsLoaded) {
    console.log('🔄 Chargement des traductions Subscription...')
    
    try {
      // Import synchrone des stores pour déclencher l'enregistrement des traductions
      useSubscriptionsStore()
      useUsageMetricsStore() 
      useInvoicesStore()
      useSubscriptionPlansStore()
      
      translationsLoaded = true
      console.log('✅ Traductions Subscription chargées')
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des traductions:', error)
    }
  }
  
  return {
    t
  }
}