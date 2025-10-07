<template>
  <div class="recent-invoices">
    <h3>
      <i class="fas fa-file-invoice"></i>
      {{ t('invoices.recent') }}
      <router-link to="/invoices" class="btn btn-sm btn-outline-primary">
        {{ t('invoices.view_all') }}
      </router-link>
    </h3>

    <div v-if="invoices.length > 0" class="invoices-list">
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


const { t } = useSubscriptionTranslations()


interface Props {
  invoices: any[]
  downloadingIds: Set<string>
}

defineProps<Props>()

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
  border: 1px solid #e9ecef;
}

.recent-invoices h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 20px 0;
  color: #495057;
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
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  transition: background-color 0.2s ease;
}

.invoice-item:hover {
  background: #f0f0f0;
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
  color: #6c757d;
}

.invoice-amount {
  font-weight: 600;
  color: #495057;
}

.invoice-actions {
  display: flex;
  gap: 8px;
}

.no-invoices {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.no-invoices i {
  margin-bottom: 15px;
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
  color: #007bff;
  border-color: #007bff;
  background-color: transparent;
}

.btn-outline-primary:hover:not(:disabled) {
  color: #fff;
  background-color: #007bff;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
  background-color: transparent;
}

.btn-outline-secondary:hover:not(:disabled) {
  color: #fff;
  background-color: #6c757d;
}

/* Text utilities */
.text-success { color: #28a745 !important; }
.text-info { color: #17a2b8 !important; }
.text-warning { color: #ffc107 !important; }
.text-danger { color: #dc3545 !important; }
.text-muted { color: #6c757d !important; }

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