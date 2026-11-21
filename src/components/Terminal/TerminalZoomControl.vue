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
    <Button
      variant="outline-secondary"
      size="sm"
      icon="fas fa-search-minus"
      :disabled="!canZoomOut"
      :title="t('terminalZoom.zoomOut')"
      :aria-label="t('terminalZoom.zoomOut')"
      data-testid="terminal-zoom-out"
      @click="zoomOut"
    />
    <Button
      variant="outline-secondary"
      size="sm"
      :title="t('terminalZoom.reset')"
      data-testid="terminal-zoom-reset"
      @click="resetZoom"
    >
      {{ Math.round(zoom * 100) }}%
    </Button>
    <Button
      variant="outline-secondary"
      size="sm"
      icon="fas fa-search-plus"
      :disabled="!canZoomIn"
      :title="t('terminalZoom.zoomIn')"
      :aria-label="t('terminalZoom.zoomIn')"
      data-testid="terminal-zoom-in"
      @click="zoomIn"
    />
  </div>
</template>

<script setup lang="ts">
import Button from '../UI/Button.vue'
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
.ocf-terminal-zoom {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-family: var(--font-family-primary);
}

/* Presenting happens on a desktop or a projector; on a phone the header has no
   room to spare and pinch-zoom covers the need. */
@media (max-width: 768px) {
  .ocf-terminal-zoom {
    display: none;
  }
}
</style>
