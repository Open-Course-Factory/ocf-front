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

<script setup lang="ts">
/**
 * A participant's control state at a glance (#384) — internet off, blocked in
 * the class, the organisation or the platform — in the members list's name
 * cell and on the wall's tile, read from the class's one bulk read.
 */
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import type { ParticipantBlock, ParticipantControls } from '../../services/domain/terminal/participantControlsService'

const props = defineProps<{
  participant: ParticipantControls | null
  /** Icons only, the words in the tooltip — for the wall's narrow tiles. */
  iconOnly?: boolean
}>()

const { t } = useTranslations({
  en: {
    participantChips: {
      internetOff: 'Internet off',
      blockedClass: 'Blocked in the class',
      blockedOrg: 'Blocked by the organisation',
      blockedPlatform: 'Blocked by the platform',
      reason: 'Reason: {reason}'
    }
  },
  fr: {
    participantChips: {
      internetOff: 'Internet coupé',
      blockedClass: 'Bloqué dans la classe',
      blockedOrg: 'Bloqué par l’organisation',
      blockedPlatform: 'Bloqué par la plateforme',
      reason: 'Motif : {reason}'
    }
  }
})

const internetOff = computed(() =>
  (props.participant?.sessions ?? []).some(s => s.state !== 'deleted' && s.network_feature && s.network_disabled)
)

function blockTitle(label: string, block: ParticipantBlock | null | undefined): string {
  return block?.reason ? `${label} — ${t('participantChips.reason', { reason: block.reason })}` : label
}
</script>

<template>
  <span v-if="participant" class="ocf-participant-chips">
    <span
      v-if="internetOff"
      class="badge badge-warning"
      data-testid="participant-chip-internet-off"
      :title="t('participantChips.internetOff')"
      :role="iconOnly ? 'img' : undefined"
      :aria-label="iconOnly ? t('participantChips.internetOff') : undefined"
    >
      <i class="fas fa-plug-circle-xmark" aria-hidden="true"></i>
      <span v-if="!iconOnly">{{ t('participantChips.internetOff') }}</span>
    </span>
    <span
      v-if="participant.class_block"
      class="badge badge-danger"
      data-testid="participant-chip-blocked-class"
      :title="blockTitle(t('participantChips.blockedClass'), participant.class_block)"
      :role="iconOnly ? 'img' : undefined"
      :aria-label="iconOnly ? blockTitle(t('participantChips.blockedClass'), participant.class_block) : undefined"
    >
      <i class="fas fa-ban" aria-hidden="true"></i>
      <span v-if="!iconOnly">{{ t('participantChips.blockedClass') }}</span>
    </span>
    <span
      v-if="participant.org_block"
      class="badge badge-danger"
      data-testid="participant-chip-blocked-org"
      :title="blockTitle(t('participantChips.blockedOrg'), participant.org_block)"
      :role="iconOnly ? 'img' : undefined"
      :aria-label="iconOnly ? blockTitle(t('participantChips.blockedOrg'), participant.org_block) : undefined"
    >
      <i class="fas fa-building-lock" aria-hidden="true"></i>
      <span v-if="!iconOnly">{{ t('participantChips.blockedOrg') }}</span>
    </span>
    <span
      v-if="participant.global_block"
      class="badge badge-danger"
      data-testid="participant-chip-blocked-platform"
      :title="t('participantChips.blockedPlatform')"
      :role="iconOnly ? 'img' : undefined"
      :aria-label="iconOnly ? t('participantChips.blockedPlatform') : undefined"
    >
      <i class="fas fa-shield-halved" aria-hidden="true"></i>
      <span v-if="!iconOnly">{{ t('participantChips.blockedPlatform') }}</span>
    </span>
  </span>
</template>

<style scoped>
.ocf-participant-chips {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  vertical-align: middle;
}

.ocf-participant-chips .badge {
  gap: var(--spacing-xs);
}
</style>
