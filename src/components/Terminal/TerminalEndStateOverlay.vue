<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * End-of-session overlay displayed on top of the terminal.
 * Shows the appropriate icon, message, and navigation actions based on the session end reason.
 */
-->

<template>
  <div class="terminal-end-state" :class="'end-state--' + reason" role="status">
    <div class="end-state-content">
      <div class="end-state-icon">
        <i :class="config.icon" aria-hidden="true"></i>
      </div>
      <h3 class="end-state-title">{{ config.title }}</h3>
      <p class="end-state-body">{{ config.body }}</p>
      <div class="end-state-actions">
        <router-link :to="config.primaryRoute" class="end-state-btn" :class="'btn--' + config.tone">
          {{ config.primaryLabel }}
        </router-link>
        <router-link v-if="config.secondaryRoute" :to="config.secondaryRoute" class="end-state-btn-secondary">
          {{ config.secondaryLabel }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EndStateConfig, EndStateReason } from '../../composables/useEndStateConfig'

interface Props {
  reason: EndStateReason
  config: EndStateConfig
}

defineProps<Props>()
</script>

<style scoped>
.terminal-end-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-primary);
}

.end-state-content {
  text-align: center;
  max-width: 420px;
  padding: var(--spacing-2xl);
}

.end-state-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.end-state--completed .end-state-icon { color: var(--color-success); }
.end-state--abandoned .end-state-icon { color: var(--color-info); }
.end-state--expired .end-state-icon { color: var(--color-warning); }
.end-state--stopped .end-state-icon { color: var(--color-info); }
.end-state--setup_failed .end-state-icon { color: var(--color-danger); }

.end-state-title {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.end-state-body {
  margin: 0 0 var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.end-state-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  align-items: center;
}

.end-state-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  cursor: pointer;
  border: none;
  color: var(--color-white);
  transition: opacity var(--transition-fast);
}

.end-state-btn:hover { opacity: 0.9; }

.btn--success { background-color: var(--color-success); }
.btn--info { background-color: var(--color-info); }
.btn--warning { background-color: var(--color-warning); }
.btn--danger { background-color: var(--color-danger); }

.end-state-btn-secondary {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  cursor: pointer;
  padding: var(--spacing-xs);
}

.end-state-btn-secondary:hover {
  color: var(--color-text-primary);
}
</style>
