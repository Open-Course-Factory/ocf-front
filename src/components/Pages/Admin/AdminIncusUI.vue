<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="admin-infrastructure">
    <!-- Compact toolbar: title + backend selector in one row -->
    <div class="infra-toolbar">
      <div class="toolbar-left">
        <i class="fas fa-server"></i>
        <h2>{{ t('infrastructure.title') }}</h2>
      </div>

      <div v-if="availableBackends.length > 0" class="toolbar-right">
        <label for="backend-select">{{ t('infrastructure.backend') }}</label>
        <div class="select-wrapper">
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
      </div>

      <div v-if="selectedBackend" class="toolbar-status">
        <span
          class="status-dot"
          :class="{ online: selectedBackend.connected, offline: !selectedBackend.connected }"
        ></span>
        <span class="status-text">{{ selectedBackend.connected ? t('infrastructure.online') : t('infrastructure.offline') }}</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="backendsStore.isLoading" class="state-overlay">
      <i class="fas fa-spinner fa-spin fa-2x"></i>
      <p>{{ t('infrastructure.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="backendsStore.error" class="state-overlay error">
      <i class="fas fa-exclamation-triangle fa-2x"></i>
      <p>{{ backendsStore.error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="availableBackends.length === 0 && !backendsStore.isLoading" class="state-overlay">
      <i class="fas fa-server fa-2x"></i>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTranslations } from '../../../composables/useTranslations'
import { useTerminalBackendsStore } from '../../../stores/terminalBackends'
import { useCurrentUserStore } from '../../../stores/currentUser'
import { useOrganizationsStore } from '../../../stores/organizations'
import { tokenService } from '../../../services/auth'
import { terminalService } from '../../../services/domain/terminal'
import type { Backend } from '../../../types/entities'

const { t } = useTranslations({
  en: {
    infrastructure: {
      title: 'Infrastructure',
      backend: 'Backend',
      loading: 'Loading backends...',
      noBackends: 'No backends available',
      online: 'Connected',
      offline: 'Offline',
      iframeTitle: 'Incus Management UI'
    }
  },
  fr: {
    infrastructure: {
      title: 'Infrastructure',
      backend: 'Backend',
      loading: 'Chargement des backends...',
      noBackends: 'Aucun backend disponible',
      online: 'Connecté',
      offline: 'Hors ligne',
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

const selectedBackend = computed(() => {
  if (!selectedBackendId.value) return null
  return availableBackends.value.find(b => b.id === selectedBackendId.value) || null
})

const authReady = ref(false)

const iframeSrc = computed(() => {
  if (!selectedBackendId.value || !authReady.value) return null
  // Use a same-origin path so the auth cookie (set by the _auth endpoint)
  // is sent with the iframe request. In dev, Vite proxies /api/v1/incus-ui
  // to the API server. In production, the reverse proxy handles it.
  return `/api/v1/incus-ui/${selectedBackendId.value}/ui/`
})

function onBackendChange() {
  // The iframe src is reactive via the computed, so nothing extra needed
}

// Remove parent .content-area border-radius and padding to maximize iframe space
const contentArea = ref<HTMLElement | null>(null)
onMounted(() => {
  contentArea.value = document.querySelector('.content-area') as HTMLElement
  if (contentArea.value) {
    contentArea.value.style.borderRadius = '0'
    contentArea.value.style.boxShadow = 'none'
    contentArea.value.style.padding = '0'
  }
})
onBeforeUnmount(() => {
  if (contentArea.value) {
    contentArea.value.style.borderRadius = ''
    contentArea.value.style.boxShadow = ''
    contentArea.value.style.padding = ''
  }
})

onMounted(async () => {
  try {
    // Set auth cookie via a same-origin fetch (goes through Vite proxy in
    // dev, or directly in production). Using fetch() with a relative URL
    // instead of axios ensures the request goes to the same origin as the
    // page, so the Set-Cookie response sets the cookie on the right domain.
    const token = tokenService.getAccessToken()
    await fetch('/api/v1/incus-ui/_auth/cookie', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    authReady.value = true

    await organizationsStore.loadOrganizations()

    if (isAdmin.value) {
      await backendsStore.fetchBackends()
    } else {
      // For non-admin users, fetch backends per org to avoid 403
      const userOrgs = organizationsStore.userOrganizations
      const enabledOrgs = userOrgs.filter(org => org.incus_ui_enabled)
      const allBackends: Backend[] = []
      const seenIds = new Set<string>()

      await Promise.all(
        enabledOrgs.map(async (org) => {
          const orgBackends = await terminalService.getBackends(org.id)
          for (const b of orgBackends) {
            if (!seenIds.has(b.id)) {
              seenIds.add(b.id)
              allBackends.push(b)
            }
          }
        })
      )

      backendsStore.backends = allBackends
    }

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
  height: calc(100vh - 60px);
  overflow: hidden;
}

.infra-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-bg-primary);
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  min-height: 42px;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.toolbar-left i {
  color: var(--color-primary);
  font-size: 1rem;
}

.toolbar-left h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-weight: var(--font-weight-semibold);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.toolbar-right label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.select-wrapper select {
  padding: 4px var(--spacing-sm);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  min-width: 160px;
  cursor: pointer;
}

.select-wrapper select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb, 59, 130, 246), 0.15);
}

.toolbar-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 3px var(--spacing-sm);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-secondary);
  font-size: var(--font-size-xs);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.online {
  background: var(--color-success, #22c55e);
  box-shadow: 0 0 4px var(--color-success, #22c55e);
}

.status-dot.offline {
  background: var(--color-text-muted);
}

.status-text {
  color: var(--color-text-secondary);
}

.incus-iframe-container {
  flex: 1;
  min-height: 0;
}

.incus-iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.state-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: var(--spacing-md);
  color: var(--color-text-muted);
}

.state-overlay i {
  opacity: 0.4;
}

.state-overlay.error {
  color: var(--color-danger-text);
}

.state-overlay.error i {
  color: var(--color-danger);
  opacity: 1;
}
</style>
