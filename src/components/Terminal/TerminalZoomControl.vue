<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */
-->

<template>
  <div class="ocf-terminal-zoom" role="group" :aria-label="t('terminalZoom.label')" @click.stop>
    <button
      type="button"
      class="ocf-terminal-zoom__btn"
      :disabled="!canZoomOut"
      :title="t('terminalZoom.zoomOut')"
      :aria-label="t('terminalZoom.zoomOut')"
      data-testid="terminal-zoom-out"
      @click="zoomOut"
    >
      <i class="fas fa-minus"></i>
    </button>
    <button
      type="button"
      class="ocf-terminal-zoom__btn ocf-terminal-zoom__level"
      :title="t('terminalZoom.reset')"
      data-testid="terminal-zoom-reset"
      @click="resetZoom"
    >
      {{ Math.round(zoom * 100) }}%
    </button>
    <button
      type="button"
      class="ocf-terminal-zoom__btn"
      :disabled="!canZoomIn"
      :title="t('terminalZoom.zoomIn')"
      :aria-label="t('terminalZoom.zoomIn')"
      data-testid="terminal-zoom-in"
      @click="zoomIn"
    >
      <i class="fas fa-plus"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useTerminalZoom } from '../../composables/useTerminalZoom'
import { useTranslations } from '../../composables/useTranslations'

const { zoom, canZoomIn, canZoomOut, zoomIn, zoomOut, resetZoom } = useTerminalZoom()

const { t } = useTranslations({
  en: {
    terminalZoom: {
      label: 'Terminal text size',
      zoomIn: 'Larger terminal text',
      zoomOut: 'Smaller terminal text',
      reset: 'Back to normal size'
    }
  },
  fr: {
    terminalZoom: {
      label: 'Taille du texte du terminal',
      zoomIn: 'Agrandir le texte du terminal',
      zoomOut: 'Réduire le texte du terminal',
      reset: 'Revenir à la taille normale'
    }
  }
})
</script>

<style scoped>
/* One small pill, so the three controls read as a single tool. */
.ocf-terminal-zoom {
  display: inline-flex;
  align-items: center;
  height: 26px;
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-full);
  background: var(--color-bg-primary);
  overflow: hidden;
  font-family: var(--font-family-primary);
}

.ocf-terminal-zoom__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-width: 24px;
  padding: 0 var(--spacing-xs);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.ocf-terminal-zoom__btn:hover:not(:disabled) {
  color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.ocf-terminal-zoom__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Fixed width: going from 90% to 100% must not shift the buttons. */
.ocf-terminal-zoom__level {
  min-width: 40px;
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-medium);
}

@media (max-width: 768px) {
  .ocf-terminal-zoom {
    display: none;
  }
}
</style>
