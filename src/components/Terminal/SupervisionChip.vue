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

  `sizer` mode renders the SAME box, invisible and out of the a11y tree, so it can
  reserve the chip's width inside SupervisionSlot — identical metrics by construction
  (it IS a chip). In sizer mode the icon is a ::before (keyed by variant) instead of a
  text node, so the element's text content stays exactly the message string.

  Distinct from the trainer-side `.supervision-chip` in SupervisionViewer.vue: that
  one badges the observer/control status on a supervisor's tile. Both are scoped, so
  the shared class name does not collide.
-->
<template>
  <div
    class="supervision-chip-box"
    :class="sizer
      ? ['supervision-slot-sizer', controlled ? 'supervision-slot-sizer-controlled' : 'supervision-slot-sizer-watched']
      : ['supervision-chip', { 'supervision-chip-controlled': controlled, 'supervision-chip-overlay': overlay }]"
    :role="sizer ? undefined : (controlled ? 'alert' : 'status')"
    :aria-live="sizer ? undefined : (controlled ? 'assertive' : 'polite')"
    :aria-hidden="sizer ? 'true' : undefined"
  >
    <span v-if="!sizer" class="supervision-chip-icon" aria-hidden="true">{{ icon }}</span>
    <span class="supervision-chip-text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text: string
  controlled: boolean
  // Unused in sizer mode (the ::before icon is keyed by `controlled`).
  icon?: string
  // When there is no header to host the chip, the parent renders it absolutely
  // positioned over the terminal so the RGPD-mandatory indicator stays visible.
  overlay?: boolean
  // Invisible width-reservation instance for SupervisionSlot (see its comment).
  sizer?: boolean
}

withDefaults(defineProps<Props>(), {
  icon: '',
  overlay: false,
  sizer: false
})
</script>

<style scoped>
/* Box metrics shared by the visible chip and its sizer twin — the single source of
   truth for the reserved width. */
.supervision-chip-box {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-sm);
  border: var(--border-width-thin) solid transparent;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
  white-space: nowrap;
}

.supervision-chip {
  border-radius: var(--border-radius-full);
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  border-color: var(--color-info-border);
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

/* Sizer twin: invisible and out of flow-affecting concerns except width. The icon is
   a ::before so it reserves the icon+gap width without entering text content. */
.supervision-slot-sizer {
  visibility: hidden;
  pointer-events: none;
}

.supervision-slot-sizer::before {
  font-size: 1em;
  line-height: 1;
}

.supervision-slot-sizer-watched::before {
  content: '👁';
}

.supervision-slot-sizer-controlled::before {
  content: '✋';
}
</style>
