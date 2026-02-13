<template>
  <div class="recent-invoices">
    <h3>
      <i class="fas fa-file-invoice"></i>
      {{ t('invoices.recent') }}
      <router-link to="/invoices" class="btn btn-sm btn-outline-primary">
        {{ t('invoices.view_all') }}
      </router-link>
    </h3>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="invoices-list">
      <div v-for="n in 3" :key="n" class="invoice-item skeleton-invoice">
        <div class="skeleton-content">
          <LoadingSkeleton variant="text" width="150px" height="18px" />
          <LoadingSkeleton variant="text" width="100px" height="14px" style="margin-top: 8px" />
        </div>
        <div class="skeleton-actions">
          <LoadingSkeleton variant="button" width="36px" height="32px" />
          <LoadingSkeleton variant="button" width="36px" height="32px" />
        </div>
      </div>
    </div>

    <div v-else-if="invoices.length > 0" class="invoices-list">
      <div 
        v-for="invoice in invoices" 
        :key="invoice.id" 
        class="invoice-item"
      >
        <div class="invoice-info">
          <div class="invoice-header">
            <strong># {{ invoice.invoice_number }}</strong>
            <span :class="['invoice-status', getStatusClass(invoice.status)]">
              <i :class="getStatusIcon(invoice.status)"></i>
              {{ invoice.status?.toUpperCase() }}
            </span>
          </div>
          <div class="invoice-details">
            <span class="invoice-amount">{{ formatAmount(invoice.amount, invoice.currency) }}</span>
            <span class="invoice-date">{{ formatDate(invoice.invoice_date) }}</span>
          </div>
        </div>
        
        <div class="invoice-actions">
          <button 
            v-if="invoice.download_url"
            class="btn btn-sm btn-outline-primary"
            @click="$emit('downloadInvoice', invoice.id)"
            :disabled="downloadingIds.has(invoice.id)"
            :title="t('invoices.download')"
          >
            <i :class="downloadingIds.has(invoice.id) ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
          </button>
          
          <a 
            v-if="invoice.stripe_hosted_url"
            :href="invoice.stripe_hosted_url"
            target="_blank"
            class="btn btn-sm btn-outline-primary"
            :title="t('invoices.viewInStripe')"
          >
            <i class="fas fa-external-link-alt"></i>
          </a>
        </div>
      </div>
    </div>

    <div v-else class="no-invoices">
      <i class="fas fa-file-invoice fa-2x text-muted"></i>
      <p class="text-muted">{{ t('invoices.no_invoice_yet') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">

import { useInvoicesStore } from '../../../stores/invoices'
import { useSubscriptionTranslations } from '../composables/useSubscriptionTranslations'
import LoadingSkeleton from './LoadingSkeleton.vue'

const { t } = useSubscriptionTranslations()

interface Props {
  invoices: any[]
  downloadingIds: Set<string>
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<{
  downloadInvoice: [invoiceId: string]
}>()

const invoicesStore = useInvoicesStore()

// Méthodes utilitaires (délégation vers le store)
function getStatusClass(status: string) {
  return invoicesStore.getStatusClass(status)
}

function getStatusIcon(status: string) {
  return invoicesStore.getStatusIcon(status)
}

function formatAmount(amount: number, currency: string) {
  return invoicesStore.formatAmount(amount, currency)
}

function formatDate(dateString: string) {
  return invoicesStore.formatDate(dateString)
}

</script>

<style scoped>
.recent-invoices {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-gray-200);
}

.recent-invoices h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 20px 0;
  color: var(--color-gray-700);
  font-size: 1.25rem;
  gap: 10px;
}

.invoices-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.invoice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  transition: background-color 0.2s ease;
}

.invoice-item:hover {
  background: var(--color-gray-100);
}

.invoice-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 5px;
}

.invoice-status {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  font-weight: 500;
}

.invoice-details {
  display: flex;
  gap: 20px;
  font-size: 0.9rem;
  color: var(--color-gray-600);
}

.invoice-amount {
  font-weight: 600;
  color: var(--color-gray-700);
}

.invoice-actions {
  display: flex;
  gap: 8px;
}

.no-invoices {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-gray-600);
}

.no-invoices i {
  margin-bottom: 15px;
}

/* Loading skeleton styles */
.skeleton-invoice {
  opacity: 0.7;
}

.skeleton-content {
  flex: 1;
}

.skeleton-actions {
  display: flex;
  gap: 8px;
}

/* Button styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-outline-primary {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background-color: transparent;
}

.btn-outline-primary:hover:not(:disabled) {
  color: var(--color-white);
  background-color: var(--color-primary);
}

.btn-outline-secondary {
  color: var(--color-gray-600);
  border-color: var(--color-gray-600);
  background-color: transparent;
}

.btn-outline-secondary:hover:not(:disabled) {
  color: var(--color-white);
  background-color: var(--color-gray-600);
}

/* Text utilities */
.text-success { color: var(--color-success) !important; }
.text-info { color: var(--color-info) !important; }
.text-warning { color: var(--color-warning) !important; }
.text-danger { color: var(--color-danger) !important; }
.text-muted { color: var(--color-gray-600) !important; }

/* Responsive */
@media (max-width: 768px) {
  .recent-invoices h3 {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .invoice-item {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .invoice-actions {
    justify-content: center;
  }
}
</style>