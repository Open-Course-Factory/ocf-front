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
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClassContext } from '../../composables/useClassContext'
import { useTranslations } from '../../composables/useTranslations'
import GroupAnalyticsTab from '../Groups/GroupAnalyticsTab.vue'
import GroupCommandHistory from '../Groups/GroupCommandHistory.vue'

const route = useRoute()
const router = useRouter()
const { groupId, canManageClass } = useClassContext()

const { t } = useTranslations({
  en: {
    classAnalytics: {
      commandReplay: 'Command replay',
      commandReplayHelp:
        'Every command typed in this class’s terminals. Kept for finding out what happened in one session, not for following the class day to day.',
      show: 'Show',
      hide: 'Hide'
    }
  },
  fr: {
    classAnalytics: {
      commandReplay: 'Relecture des commandes',
      commandReplayHelp:
        'Toutes les commandes tapées dans les terminaux de cette classe. Sert à comprendre ce qui s’est passé dans une session, pas au suivi quotidien de la classe.',
      show: 'Afficher',
      hide: 'Masquer'
    }
  }
})

/**
 * Command replay is forensic: it is consulted when something needs explaining,
 * never in the ordinary course of following a class. So it is a section of this
 * page, below the figures and folded away — and it is only MOUNTED once opened,
 * so its own fetches are not paid by every visit to the analytics.
 *
 * `?section=history` opens it, which is where the retired `?tab=history` links
 * land.
 */
const isReplayOpen = ref(route.query.section === 'history')

function toggleReplay(): void {
  isReplayOpen.value = !isReplayOpen.value

  const query = { ...route.query }
  if (isReplayOpen.value) {
    query.section = 'history'
  } else {
    delete query.section
  }

  // `replace`, not `push`: unfolding a section is a view of the same page, so
  // Back must leave the analytics rather than fold the section again.
  router.replace({ path: route.path, query })
}
</script>

<template>
  <div class="class-analytics-page">
    <GroupAnalyticsTab :group-id="groupId" :can-edit-group="canManageClass" />

    <section class="command-replay">
      <button
        type="button"
        class="replay-toggle"
        :aria-expanded="isReplayOpen"
        aria-controls="class-command-replay"
        @click="toggleReplay"
      >
        <i class="fas fa-history" aria-hidden="true"></i>
        <span class="replay-title">{{ t('classAnalytics.commandReplay') }}</span>
        <span class="replay-action">{{ isReplayOpen ? t('classAnalytics.hide') : t('classAnalytics.show') }}</span>
      </button>

      <p class="replay-help">{{ t('classAnalytics.commandReplayHelp') }}</p>

      <div id="class-command-replay">
        <GroupCommandHistory v-if="isReplayOpen" :group-id="groupId" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.command-replay {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: var(--border-width-thin) solid var(--color-border-light);
}

.replay-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  text-align: left;
}

.replay-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.replay-title {
  flex: 1;
}

.replay-action {
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.replay-help {
  margin: var(--spacing-xs) 0 var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
</style>
