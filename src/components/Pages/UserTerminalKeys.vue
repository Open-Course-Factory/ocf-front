<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */ 
-->

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useNotification } from '../../composables/useNotification';
import { usePageLoad } from '../../composables/usePageLoad';
import { useLoadingState } from '../../composables/useLoadingState';
import { extractErrorMessage } from '../../utils/formatters';
import { useTranslations } from '../../composables/useTranslations';
import BaseModal from '../Modals/BaseModal.vue';
import ErrorAlert from '../UI/ErrorAlert.vue';

const { t } = useTranslations({
  en: {
    terminalKeys: {
      title: 'Terminal Access Keys',
      regenerate: 'Regenerate key',
      securityNotice: 'Keep your terminal key secure. It grants access to terminal sessions.',
      keyDetails: 'Key details',
      labelId: 'ID:',
      labelKeyName: 'Key name:',
      labelStatus: 'Status:',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      labelMaxSessions: 'Max sessions:',
      labelCreatedAt: 'Created at:',
      noKeyTitle: 'No terminal key found',
      noKeyDescription: 'Click "Regenerate key" to create one.',
      confirmTitle: 'Confirmation',
      confirmBtn: 'Confirm',
      cancelBtn: 'Cancel',
      confirmMessage: 'Are you sure you want to regenerate your terminal key? This will invalidate the current key.',
      loadError: 'Error loading key',
      regenerateSuccess: 'Key regenerated successfully',
      regenerateError: 'Error regenerating key',
      error: 'Error'
    }
  },
  fr: {
    terminalKeys: {
      title: 'Clés d\'accès Terminal',
      regenerate: 'Régénérer la clé',
      securityNotice: 'Gardez votre clé terminal sécurisée. Elle donne accès aux sessions terminal.',
      keyDetails: 'Détails de la clé',
      labelId: 'ID :',
      labelKeyName: 'Nom de la clé :',
      labelStatus: 'Statut :',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      labelMaxSessions: 'Sessions max :',
      labelCreatedAt: 'Créée le :',
      noKeyTitle: 'Aucune clé terminal trouvée',
      noKeyDescription: 'Cliquez sur "Régénérer la clé" pour en créer une.',
      confirmTitle: 'Confirmation',
      confirmBtn: 'Confirmer',
      cancelBtn: 'Annuler',
      confirmMessage: 'Êtes-vous sûr de vouloir régénérer votre clé terminal ? Cela invalidera la clé actuelle.',
      loadError: 'Erreur lors du chargement de la clé',
      regenerateSuccess: 'Clé régénérée avec succès',
      regenerateError: 'Erreur lors de la régénération',
      error: 'Erreur'
    }
  }
});

const { showSuccess, showError } = useNotification();
const { error, withErrorHandling } = usePageLoad();
const { isLoading: isRegenerating, withLoading } = useLoadingState();

const currentKey = ref(null);
const showConfirm = ref(false);

onMounted(() => {
  loadKey();
});

async function loadKey() {
  await withErrorHandling(
    async () => {
      const response = await axios.get('/user-terminal-keys/my-key');
      currentKey.value = response.data;
    },
    t('terminalKeys.loadError')
  );
}

function confirmRegenerate() {
  showConfirm.value = true;
}

async function regenerateKey() {
  await withLoading(async () => {
    try {
      await axios.post('/user-terminal-keys/regenerate');
      await loadKey();
      showConfirm.value = false;
      showSuccess(t('terminalKeys.regenerateSuccess'));
    } catch (err: any) {
      console.error('Error regenerating key:', err);
      showError(extractErrorMessage(err, t('terminalKeys.regenerateError')), t('terminalKeys.error'));
    }
  });
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}
</script>

<template>
  <div class="wrapper">
    <div class="content">
      <div class="header">
        <h2>{{ t('terminalKeys.title') }}</h2>
        <button
          class="btn btn-warning"
          @click="confirmRegenerate"
          :disabled="isRegenerating"
        >
          <i v-if="isRegenerating" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-sync"></i>
          {{ t('terminalKeys.regenerate') }}
        </button>
      </div>

      <!-- Message d'erreur global (utilise le nouveau composant ErrorAlert) -->
      <ErrorAlert
        :message="error"
        @dismiss="error = ''"
      />

      <div v-if="currentKey" class="key-details">
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          {{ t('terminalKeys.securityNotice') }}
        </div>

        <div class="key-card">
          <h3>{{ t('terminalKeys.keyDetails') }}</h3>
          <div class="details-grid">
            <div class="detail-item">
              <label>{{ t('terminalKeys.labelId') }}</label>
              <span>{{ currentKey.id }}</span>
            </div>
            <div class="detail-item">
              <label>{{ t('terminalKeys.labelKeyName') }}</label>
              <span>{{ currentKey.key_name }}</span>
            </div>
            <div class="detail-item">
              <label>{{ t('terminalKeys.labelStatus') }}</label>
              <span :class="['badge', currentKey.is_active ? 'active' : 'inactive']">
                {{ currentKey.is_active ? t('terminalKeys.statusActive') : t('terminalKeys.statusInactive') }}
              </span>
            </div>
            <div class="detail-item">
              <label>{{ t('terminalKeys.labelMaxSessions') }}</label>
              <span>{{ currentKey.max_sessions === -1 ? '∞' : currentKey.max_sessions }}</span>
            </div>
            <div class="detail-item">
              <label>{{ t('terminalKeys.labelCreatedAt') }}</label>
              <span>{{ formatDate(currentKey.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-key">
        <i class="fas fa-key fa-3x"></i>
        <h4>{{ t('terminalKeys.noKeyTitle') }}</h4>
        <p>{{ t('terminalKeys.noKeyDescription') }}</p>
      </div>

      <!-- Modal de confirmation simple -->
      <BaseModal
        :visible="showConfirm"
        :title="t('terminalKeys.confirmTitle')"
        title-icon="fas fa-exclamation-triangle"
        size="small"
        :show-default-footer="true"
        :confirm-text="t('terminalKeys.confirmBtn')"
        confirm-icon="fas fa-check"
        :confirm-disabled="isRegenerating"
        :cancel-text="t('terminalKeys.cancelBtn')"
        @close="showConfirm = false"
        @confirm="regenerateKey"
      >
        <p>{{ t('terminalKeys.confirmMessage') }}</p>
      </BaseModal>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  width: 100%;
  padding: var(--spacing-lg);
}

.content {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.header h2 {
  color: var(--color-text-primary);
}

.loading {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.alert {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  margin: var(--spacing-md) 0;
}

.alert-info {
  background-color: var(--color-info-bg);
  border: var(--border-width-thin) solid var(--color-info);
  color: var(--color-info-text);
}

.alert-danger {
  background-color: var(--color-danger-bg);
  border: var(--border-width-thin) solid var(--color-danger);
  color: var(--color-danger-text);
}

.key-card {
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.key-card h3 {
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
}

.details-grid {
  display: grid;
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.detail-item label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.detail-item span {
  color: var(--color-text-primary);
}

.badge {
  padding: 0.25em 0.5em;
  font-size: var(--font-size-xs);
  border-radius: var(--border-radius-full);
  color: var(--color-white);
}

.badge.active {
  background-color: var(--color-success);
}

.badge.inactive {
  background-color: var(--color-danger);
}

.no-key {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  color: var(--color-text-muted);
}

.no-key i {
  color: var(--color-text-muted);
  opacity: 0.5;
  margin-bottom: var(--spacing-lg);
}

.no-key h4 {
  color: var(--color-text-primary);
}

.no-key p {
  color: var(--color-text-muted);
}

.btn {
  padding: var(--btn-padding-sm);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
}

.btn-warning {
  background-color: var(--color-warning);
  color: var(--color-black);
}

.btn-warning:hover:not(:disabled) {
  background-color: var(--color-warning-hover);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-white);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-hover);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>