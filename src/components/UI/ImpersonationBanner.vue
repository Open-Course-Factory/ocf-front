<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 */
-->

<template>
  <div v-if="store.isImpersonating" class="impersonation-banner" role="alert">
    <div class="banner-content">
      <i class="fas fa-user-secret banner-icon" aria-hidden="true"></i>
      <span class="banner-text">
        <strong>{{ t('impersonationBanner.label') }}</strong>
        <span class="space"> </span>
        <span class="target-name">{{ targetName }}</span>
        <span class="separator"> · </span>
        <span class="admin-info">
          {{ t('impersonationBanner.asAdmin') }} <strong>{{ adminName }}</strong>
        </span>
        <span class="separator"> · </span>
        <span class="expiry-note">{{ t('impersonationBanner.expiry') }}</span>
      </span>
      <button
        type="button"
        class="stop-impersonating"
        @click="onStop"
        :disabled="stopping"
      >
        <i class="fas fa-times" aria-hidden="true"></i>
        {{ t('impersonationBanner.stop') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useImpersonationStore } from '../../stores/impersonation'
import { useTranslations } from '../../composables/useTranslations'

const store = useImpersonationStore()
const stopping = ref(false)

const { t } = useTranslations({
  en: {
    impersonationBanner: {
      label: 'Impersonating',
      asAdmin: 'as',
      expiry: 'auto-expires after 30 min of inactivity',
      stop: 'Stop impersonating',
    },
  },
  fr: {
    impersonationBanner: {
      label: 'Vous incarnez',
      asAdmin: 'en tant que',
      expiry: 'expire après 30 min d’inactivité',
      stop: 'Arrêter l’incarnation',
    },
  },
})

const targetName = computed(() => {
  const display = store.target?.display_name?.trim()
  if (display) return display
  return store.target?.username || store.targetUserId || ''
})

const adminName = computed(() => {
  const display = store.impersonator?.display_name?.trim()
  if (display) return display
  return store.impersonator?.username || ''
})

async function onStop() {
  if (stopping.value) return
  stopping.value = true
  try {
    await store.stop()
    // Full reload so all Pinia stores re-initialize under the admin's own
    // identity. SPA navigation would keep the impersonated user's cached
    // store state and break the UI in unpredictable ways.
    window.location.href = '/'
  } finally {
    // Will run before navigation actually happens, that's fine.
    stopping.value = false
  }
}
</script>

<style scoped>
.impersonation-banner {
  position: sticky;
  top: 0;
  z-index: var(--z-index-modal, 9999);
  width: 100%;
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-bottom: 2px solid var(--color-danger-border);
  padding: var(--spacing-sm, 0.6rem) var(--spacing-md, 1rem);
  box-shadow: var(--shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.08));
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 1400px;
  margin: 0 auto;
}

.banner-icon {
  font-size: 1.1rem;
  color: var(--color-danger);
}

.banner-text {
  flex: 1;
  font-size: 0.92rem;
  line-height: 1.3;
}

.target-name {
  font-weight: 600;
}

.separator {
  opacity: 0.5;
  margin: 0 0.15rem;
}

.expiry-note {
  opacity: 0.85;
  font-style: italic;
}

.stop-impersonating {
  background: var(--color-danger);
  color: var(--color-white);
  border: none;
  padding: 0.4rem 0.9rem;
  border-radius: var(--border-radius-sm, 4px);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: opacity 0.15s, background-color 0.15s;
}

.stop-impersonating:hover:not(:disabled) {
  background: var(--color-danger-hover);
}

.stop-impersonating:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .banner-text {
    font-size: 0.82rem;
  }
  .separator,
  .expiry-note {
    display: none;
  }
}
</style>
