<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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

<!--
  Learner-facing supervision indicator: a compact chip shown to the STUDENT while a
  trainer is watching (info) or has taken control (danger). It lives in the terminal
  title bar so appearing/disappearing never changes the terminal's layout box (the
  old flow banner shifted the terminal — the bug this fixes). When there is no title
  bar to host it, the parent renders it as an `overlay` chip over the terminal.

  Distinct from the trainer-side `.supervision-chip` in SupervisionViewer.vue: that
  one badges the observer/control status on a supervisor's tile. Both are scoped, so
  the shared class name does not collide.
-->
<template>
  <div
    class="supervision-chip"
    :class="{
      'supervision-chip-controlled': controlled,
      'supervision-chip-overlay': overlay
    }"
    :role="controlled ? 'alert' : 'status'"
    :aria-live="controlled ? 'assertive' : 'polite'"
  >
    <span class="supervision-chip-icon" aria-hidden="true">{{ icon }}</span>
    <span class="supervision-chip-text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: string
  text: string
  controlled: boolean
  // When there is no header to host the chip, the parent renders it absolutely
  // positioned over the terminal so the RGPD-mandatory indicator stays visible.
  overlay?: boolean
}

withDefaults(defineProps<Props>(), {
  overlay: false
})
</script>

<style scoped>
.supervision-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
  white-space: nowrap;
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  border: var(--border-width-thin) solid var(--color-info-border);
}

.supervision-chip-controlled {
  background-color: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-color: var(--color-danger-border);
}

.supervision-chip-overlay {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  z-index: 50;
  box-shadow: 0 2px 6px color-mix(in srgb, var(--color-black) 30%, transparent);
}

.supervision-chip-icon {
  font-size: 1em;
  line-height: 1;
}
</style>
