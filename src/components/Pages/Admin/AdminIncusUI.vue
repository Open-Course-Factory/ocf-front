<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="admin-infrastructure">
    <div class="page-header">
      <h2><i class="fas fa-server"></i> {{ t('infrastructure.title') }}</h2>
    </div>

    <!-- Backend Selector -->
    <div v-if="availableBackends.length > 0" class="backend-selector">
      <label for="backend-select">{{ t('infrastructure.backend') }}:</label>
      <select
        id="backend-select"
        v-model="selectedBackendId"
        @change="onBackendChange"
      >
        <option
          v-for="backend in availableBackends"
          :key="backend.id"
          :value="backend.id"
        >
          {{ backend.name || backend.id }}
          <template v-if="!backend.connected"> ({{ t('infrastructure.offline') }})</template>
        </option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="backendsStore.isLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <p>{{ t('infrastructure.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="backendsStore.error" class="error-state">
      <i class="fas fa-exclamation-triangle fa-3x"></i>
      <p>{{ backendsStore.error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="availableBackends.length === 0 && !backendsStore.isLoading" class="empty-state">
      <i class="fas fa-server fa-3x"></i>
      <p>{{ t('infrastructure.noBackends') }}</p>
    </div>

    <!-- Incus UI iframe -->
    <div v-else-if="iframeSrc" class="incus-iframe-container">
      <iframe
        :src="iframeSrc"
        :title="t('infrastructure.iframeTitle')"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        allow="clipboard-read; clipboard-write"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTranslations } from '../../../composables/useTranslations'
import { useTerminalBackendsStore } from '../../../stores/terminalBackends'
import { useCurrentUserStore } from '../../../stores/currentUser'
import { useOrganizationsStore } from '../../../stores/organizations'

const { t } = useTranslations({
  en: {
    infrastructure: {
      title: 'Infrastructure',
      backend: 'Backend',
      loading: 'Loading backends...',
      noBackends: 'No backends available',
      offline: 'offline',
      iframeTitle: 'Incus Management UI'
    }
  },
  fr: {
    infrastructure: {
      title: 'Infrastructure',
      backend: 'Backend',
      loading: 'Chargement des backends...',
      noBackends: 'Aucun backend disponible',
      offline: 'hors ligne',
      iframeTitle: 'Interface de gestion Incus'
    }
  }
})

const backendsStore = useTerminalBackendsStore()
const currentUserStore = useCurrentUserStore()
const organizationsStore = useOrganizationsStore()

const selectedBackendId = ref<string | null>(null)

const isAdmin = computed(() =>
  currentUserStore.userRoles?.includes('administrator') ?? false
)

const availableBackends = computed(() => {
  if (isAdmin.value) {
    return backendsStore.backends
  }

  // For org owners/managers, filter to backends from their orgs' AllowedBackends
  const userOrgs = organizationsStore.userOrganizations
  if (!userOrgs || userOrgs.length === 0) {
    return []
  }

  // Collect all allowed backend IDs from the user's organizations
  const allowedBackendIds = new Set<string>()
  for (const org of userOrgs) {
    if (org.allowed_backends && org.allowed_backends.length > 0) {
      for (const backendId of org.allowed_backends) {
        allowedBackendIds.add(backendId)
      }
    }
  }

  // If no orgs have allowed_backends configured, return empty
  // (don't leak all backend names — server-side auth will block anyway)
  if (allowedBackendIds.size === 0) {
    return []
  }

  return backendsStore.backends.filter(b => allowedBackendIds.has(b.id))
})

const iframeSrc = computed(() => {
  if (!selectedBackendId.value) return null
  const protocol = import.meta.env.VITE_PROTOCOL || 'https'
  const apiUrl = import.meta.env.VITE_API_URL || window.location.host
  return `${protocol}://${apiUrl}/api/v1/incus-ui/${selectedBackendId.value}/ui/`
})

function onBackendChange() {
  // The iframe src is reactive via the computed, so nothing extra needed
}

onMounted(async () => {
  try {
    await Promise.all([
      backendsStore.fetchBackends(),
      organizationsStore.loadOrganizations()
    ])

    // Auto-select first available backend
    if (availableBackends.value.length > 0) {
      const connectedBackend = availableBackends.value.find(b => b.connected)
      selectedBackendId.value = connectedBackend?.id || availableBackends.value[0].id
    }
  } catch {
    // Errors are tracked per-store
  }
})
</script>

<style scoped>
.admin-infrastructure {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
}

.page-header {
  padding: var(--spacing-lg);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  background: var(--color-bg-primary);
}

.page-header h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.5rem;
}

.page-header h2 i {
  margin-right: var(--spacing-sm);
  color: var(--color-primary);
}

.backend-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
}

.backend-selector label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.backend-selector select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  min-width: 200px;
}

.backend-selector select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb, 59, 130, 246), 0.2);
}

.incus-iframe-container {
  flex: 1;
  min-height: 0;
}

.incus-iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.empty-state,
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: var(--spacing-lg);
  color: var(--color-text-muted);
}

.empty-state i,
.loading-state i {
  opacity: 0.4;
}

.error-state {
  color: var(--color-danger-text);
}

.error-state i {
  color: var(--color-danger);
}
</style>
