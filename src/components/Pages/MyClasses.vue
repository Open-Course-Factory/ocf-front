<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * "Mes classes" — the teaching console (issue #309). The teacher's home: every
 * class they own or manage, live attendance, and what is assigned, from a
 * single GET /teacher/groups.
 */
-->

<template>
  <div class="my-classes-page">
    <div class="page-header">
      <div>
        <h2>{{ t('myClasses.title') }}</h2>
        <p class="page-subtitle">{{ t('myClasses.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <button
          v-if="!isPersonalContext"
          type="button"
          class="btn btn-primary create-button"
          data-test="create-class"
          @click="showCreateModal = true"
        >
          <i class="fas fa-plus"></i>
          <span>{{ t('myClasses.createClass') }}</span>
        </button>
        <button
          type="button"
          class="refresh-button"
          data-test="refresh"
          :title="t('myClasses.refresh')"
          :disabled="store.isLoading"
          @click="store.loadGroups()"
        >
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': store.isLoading }"></i>
          <span>{{ t('myClasses.refresh') }}</span>
        </button>
      </div>
    </div>

    <div v-if="store.error" class="load-error" data-test="load-error">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ store.error }}</span>
      <button type="button" class="retry-button" data-test="retry" @click="store.loadGroups()">
        {{ t('myClasses.retry') }}
      </button>
    </div>

    <div class="class-list">
      <!-- A personal organization is not a teaching place at all, so this page
           is not a class list there — it is the way out. -->
      <div v-if="isPersonalContext" class="empty-state" data-test="personal-org-state">
        <i class="fas fa-building"></i>
        <p class="personal-org-title">{{ t('myClasses.personalOrgTitle') }}</p>
        <p data-test="personal-org-message">{{ t('myClasses.personalOrgBody') }}</p>
        <p v-if="store.managesAnyClass" class="personal-org-hint" data-test="classes-elsewhere-hint">
          {{ t('myClasses.classesElsewhere') }}
        </p>
        <router-link
          to="/organizations?create=1"
          class="btn btn-primary"
          data-test="create-organization-cta"
        >
          {{ t('myClasses.createOrganizationCta') }}
        </router-link>
      </div>

      <template v-else-if="isFirstLoad">
        <div
          v-for="placeholder in SKELETON_ROWS"
          :key="placeholder"
          class="class-row class-row--skeleton"
          data-test="class-row-skeleton"
          aria-hidden="true"
        ></div>
      </template>

      <div v-else-if="showEmptyState" class="empty-state" data-test="empty-state">
        <i class="fas fa-chalkboard-teacher"></i>
        <p data-test="empty-message">{{ emptyMessage }}</p>
        <button type="button" class="btn btn-primary" data-test="empty-cta" @click="showCreateModal = true">
          {{ t('myClasses.emptyCta') }}
        </button>
      </div>

      <template v-else>
        <ClassConsoleRow
          v-for="summary in visibleClasses"
          :key="summary.group_id"
          :summary="summary"
        />
      </template>
    </div>

    <EntityModal
      v-if="showCreateModal"
      :visible="showCreateModal"
      :entity="null"
      :entity-store="classGroupsStore"
      entity-name="class-groups"
      :fieldList="classGroupsStore.fieldList"
      @submit="createClass"
      @close="showCreateModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useVisiblePolling } from '../../composables/useVisiblePolling'
import { useTeacherGroupsStore } from '../../stores/teacherGroups'
import { useOrganizationsStore } from '../../stores/organizations'
import { useClassGroupsStore } from '../../stores/classGroups'
import ClassConsoleRow from '../Groups/ClassConsoleRow.vue'
import EntityModal from '../Modals/EntityModal.vue'

const SKELETON_ROWS = 3
const REFRESH_INTERVAL_MS = 30000

const store = useTeacherGroupsStore()
const organizationsStore = useOrganizationsStore()
const classGroupsStore = useClassGroupsStore()

const showCreateModal = ref(false)

// Same call Entity.vue makes on /class-groups, so the subgroup after-create
// hook and its partial-failure reporting run identically here. The console
// list refetches because the new class comes from a different endpoint.
async function createClass(data: Record<string, string>) {
  try {
    await classGroupsStore.createEntity('/class-groups', data)
    showCreateModal.value = false
    await store.loadGroups()
  } catch (error) {
    console.error('Error while creating class', error)
  }
}

const { t } = useTranslations({
  en: {
    myClasses: {
      title: 'My classes',
      subtitle: 'Who is connected, what is assigned, and where to step in.',
      refresh: 'Refresh',
      retry: 'Retry',
      empty: 'You do not manage any class yet.',
      emptyInOrganization: 'You manage no class in {organization}. Your other classes are in another organization — switch organization to see them.',
      emptyCta: 'Create a class',
      createClass: 'New class',
      personalOrgTitle: 'Teaching happens in an organization',
      personalOrgBody: 'Your personal space carries your plan, not your classes. Create an organization to open your first class in it.',
      classesElsewhere: 'Your existing classes are in another organization — switch organization to see them.',
      createOrganizationCta: 'Create my organization'
    }
  },
  fr: {
    myClasses: {
      title: 'Mes classes',
      subtitle: 'Qui est connecté, ce qui est assigné, et où intervenir.',
      refresh: 'Actualiser',
      retry: 'Réessayer',
      empty: 'Vous ne gérez encore aucune classe.',
      emptyInOrganization: 'Vous ne gérez aucune classe dans {organization}. Vos autres classes sont dans une autre organisation — changez d’organisation pour les voir.',
      emptyCta: 'Créer une classe',
      createClass: 'Nouvelle classe',
      personalOrgTitle: 'L’enseignement se passe dans une organisation',
      personalOrgBody: 'Votre espace personnel porte votre forfait, pas vos classes. Créez une organisation pour y ouvrir votre première classe.',
      classesElsewhere: 'Vos classes existantes sont dans une autre organisation — changez d’organisation pour les voir.',
      createOrganizationCta: 'Créer mon organisation'
    }
  }
})

// Classes never live in a personal organization (product decision #315, enforced
// in core #475), so there the console offers the way to a real one instead of a
// list and a create button the backend would refuse.
const isPersonalContext = computed(() => organizationsStore.isPersonalOrganizationContext)

// The console shows ONE organization at a time (see the teacherGroups store).
// No row names its organization: on this page they all share the active one,
// which the empty state and the switcher in the top bar already name.
const visibleClasses = computed(() => store.groupsInCurrentOrganization)

// Skeletons stand in only until the FIRST list arrives. A refresh over a list
// already on screen must not replace it with placeholders.
const isFirstLoad = computed(() => store.isLoading && store.groups.length === 0)

const showEmptyState = computed(() =>
  store.isLoaded && visibleClasses.value.length === 0 && !store.error
)

const currentOrganizationName = computed(() =>
  organizationsStore.currentOrganization?.display_name || ''
)

// "You teach nothing" and "you teach, but not here" are different situations
// and want different answers — the second one is usually one organization
// switch away from what the teacher was looking for.
// With no organization loaded yet there is no name to put in the sentence, and
// "no class in ." reads as a bug — the plain message is true either way.
const emptyMessage = computed(() => {
  if (store.managesClassInAnotherOrganization && currentOrganizationName.value) {
    return t('myClasses.emptyInOrganization', { organization: currentOrganizationName.value })
  }
  return t('myClasses.empty')
})

// Reuses the fetch the landing decision just made when arriving straight from
// login, and refetches whenever the cache is older than the refresh promise.
onMounted(() => {
  store.ensureLoaded(REFRESH_INTERVAL_MS)
})

// A tick that lands while a request is still running would only queue a second
// one behind it; skipping is the same answer, one refresh later.
useVisiblePolling(() => {
  if (!store.isLoading) store.loadGroups()
}, REFRESH_INTERVAL_MS)
</script>

<style scoped>
.my-classes-page {
  padding: var(--spacing-lg);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.page-header h2 {
  margin: 0;
  color: var(--color-text-primary);
}

.page-subtitle {
  margin: var(--spacing-xs) 0 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.create-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-tertiary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  flex-shrink: 0;
}

.refresh-button:hover:not(:disabled) {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.refresh-button:disabled {
  cursor: default;
  opacity: 0.7;
}

.load-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-danger-bg, rgba(239, 68, 68, 0.1));
  border-radius: var(--border-radius-sm);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.retry-button {
  margin-left: auto;
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  border: var(--border-width-thin) solid var(--color-danger);
  border-radius: var(--border-radius-sm);
  color: var(--color-danger);
  cursor: pointer;
}

/* The single source of a row's height: ClassConsoleRow reads this variable too,
   so a loading placeholder and a real row can never differ. */
.class-list {
  --class-row-min-height: 84px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.class-row--skeleton {
  min-height: var(--class-row-min-height);
  background: var(--color-bg-secondary);
  border: var(--border-width-thin) solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  animation: skeleton-breathe 1.6s ease-in-out infinite;
}

@keyframes skeleton-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@media (prefers-reduced-motion: reduce) {
  .class-row--skeleton {
    animation: none;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl) var(--spacing-lg);
  color: var(--color-text-muted);
  text-align: center;
}

.empty-state i {
  font-size: var(--font-size-2xl, 2rem);
  color: var(--color-text-muted);
}

.empty-state p {
  margin: 0;
}

.personal-org-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.personal-org-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
