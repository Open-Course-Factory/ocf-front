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
 * "Classe en direct" — one tab, two representations of the same class (#310).
 *
 * The teacher used to alternate between "Sessions en direct", which showed
 * terminals but not scenario position, and "Activité", which showed steps but
 * neither hints nor the live terminals. Both questions are now answered on one
 * tab: PROGRESSION is the exam view, WALL the visual invigilation, and the eye
 * button on a learner's row lands on that learner's tile — where taking the
 * hand already lives (the wall's focused viewer owns that control).
 *
 * The chosen representation survives a reload: `?view=wall` wins so the classes
 * console can link straight to the tiles, otherwise the last view used on this
 * class, otherwise the progression table.
 */
import { ref, toRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTranslations } from '../../composables/useTranslations'
import { useTabList } from '../../composables/useTabList'
import {
  useClassLiveViewPreference,
  type ClassLiveViewMode
} from '../../composables/useClassLiveViewPreference'
import ClassProgressionView from './ClassProgressionView.vue'
import GroupLiveSessionsTab from './GroupLiveSessionsTab.vue'

const props = defineProps<{
  groupId: string
  canSupervise: boolean
}>()

const { t } = useTranslations({
  en: {
    classLiveView: {
      switchLabel: 'Representation',
      progression: 'Progress',
      wall: 'Wall'
    }
  },
  fr: {
    classLiveView: {
      switchLabel: 'Représentation',
      progression: 'Progression',
      wall: 'Mur'
    }
  }
})

const route = useRoute()
const router = useRouter()
const { readStoredView, storeView } = useClassLiveViewPreference(toRef(props, 'groupId'))

function isViewMode(value: unknown): value is ClassLiveViewMode {
  return value === 'progress' || value === 'wall'
}

const queryView = route.query.view
const activeView = ref<ClassLiveViewMode>(
  isViewMode(queryView) ? queryView : readStoredView() ?? 'progress'
)

/**
 * The learner tile to open the wall on, set by the eye button on a row. Cleared
 * on the way back to the table so a later visit to the wall opens on the wall
 * itself rather than on whoever was watched last.
 */
const focusSessionId = ref<string | null>(null)

const { tablist, tabProps, panelProps, onKeydown } = useTabList(activeView, 'class-live')

const VIEWS: { id: ClassLiveViewMode; icon: string; labelKey: string }[] = [
  { id: 'progress', icon: 'fas fa-list-ul', labelKey: 'classLiveView.progression' },
  { id: 'wall', icon: 'fas fa-th-large', labelKey: 'classLiveView.wall' }
]

function showView(view: ClassLiveViewMode) {
  if (view === 'progress') focusSessionId.value = null
  activeView.value = view
}

function watchLearnerTerminal(sessionId: string) {
  focusSessionId.value = sessionId
  activeView.value = 'wall'
}

// Remember the view as soon as it is on screen, deep link included: opening a
// class through the console's wall link is choosing the wall for that class.
watch(activeView, storeView, { immediate: true })

// The view is a representation of the same page, so it is `replace`d into the
// URL like the tab above it: Back leaves the class, it does not walk back
// through the representations the teacher looked at. Only an actual change is
// written, so a plain visit does not gain a query it never asked for.
watch(activeView, view => {
  if (route.query.view !== view) {
    router.replace({ path: route.path, query: { ...route.query, view } })
  }
})

// Browser back/forward, and the console linking to `?view=wall` on a page that
// is already open.
watch(() => route.query.view, view => {
  if (isViewMode(view) && view !== activeView.value) {
    activeView.value = view
  }
})
</script>

<template>
  <div class="ocf-clv">
    <div
      ref="tablist"
      class="ocf-clv-switch"
      role="tablist"
      :aria-label="t('classLiveView.switchLabel')"
      @keydown="onKeydown"
    >
      <button
        v-for="view in VIEWS"
        :key="view.id"
        v-bind="tabProps(view.id)"
        type="button"
        class="ocf-clv-btn"
        :class="{ 'ocf-clv-btn-active': activeView === view.id }"
        @click="showView(view.id)"
      >
        <i :class="view.icon" aria-hidden="true"></i>
        {{ t(view.labelKey) }}
      </button>
    </div>

    <!--
      `v-if`, not `v-show`: leaving the wall must tear its tile WebSockets down
      rather than keep every learner's terminal streaming behind the table.
    -->
    <div v-bind="panelProps(activeView)" class="ocf-clv-panel">
      <ClassProgressionView
        v-if="activeView === 'progress'"
        :group-id="groupId"
        @watch-terminal="watchLearnerTerminal"
      />
      <GroupLiveSessionsTab
        v-else
        :group-id="groupId"
        :can-supervise="canSupervise"
        :initial-focus-session-id="focusSessionId ?? undefined"
      />
    </div>
  </div>
</template>

<style scoped>
.ocf-clv {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.ocf-clv-switch {
  display: inline-flex;
  align-self: flex-end;
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.ocf-clv-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.ocf-clv-btn + .ocf-clv-btn {
  border-left: var(--border-width-thin) solid var(--color-border-medium);
}

.ocf-clv-btn:hover {
  background: var(--color-surface-hover);
}

.ocf-clv-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.ocf-clv-btn-active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}
</style>
