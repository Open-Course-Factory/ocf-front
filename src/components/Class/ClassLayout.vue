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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useClassGroupsStore } from '../../stores/classGroups'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useTeacherGroupsStore } from '../../stores/teacherGroups'
import { useTranslations } from '../../composables/useTranslations'
import { useFeatureFlags } from '../../composables/useFeatureFlags'
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import { useGroupMembers } from '../../composables/useGroupMembers'
import { provideClassContext } from '../../composables/useClassContext'
import { CLASS_PAGE_NAMES } from '../../router/classPages'
import { userService, type User } from '../../services/domain/user'
import type { ClassGroup } from '../../types'
import type { Organization } from '../../types/organization'
import AdminBadge from '../Common/AdminBadge.vue'

// The refresh rate the "Mes classes" console promises for the same counters.
// Asking for data no older than that reuses the console's own request instead
// of issuing one per class page.
const LIVE_COUNT_MAX_AGE_MS = 30000

const route = useRoute()
const router = useRouter()
const groupStore = useClassGroupsStore()
const currentUser = useCurrentUserStore()
const teacherGroups = useTeacherGroupsStore()
const { isEnabled } = useFeatureFlags()
const { isAdmin: isPlatformAdmin } = useAdminViewMode()

const { t } = useTranslations({
  en: {
    classLayout: {
      myClasses: 'My classes',
      navLabel: 'Class pages',
      pageLive: 'Live',
      pageMembers: 'Learners',
      pageScenarios: 'Scenarios',
      pageAnalytics: 'Analytics',
      pageSettings: 'Settings',
      connected: '{live}/{total} connected',
      loading: 'Loading the class…',
      loadError: 'Failed to load this class',
      backToClasses: 'Back to my classes',
      viewingAsAdmin: 'Viewing as administrator'
    }
  },
  fr: {
    classLayout: {
      myClasses: 'Mes classes',
      navLabel: 'Pages de la classe',
      pageLive: 'En direct',
      pageMembers: 'Apprenants',
      pageScenarios: 'Scénarios',
      pageAnalytics: 'Analytiques',
      pageSettings: 'Réglages',
      connected: '{live}/{total} connectés',
      loading: 'Chargement de la classe…',
      loadError: 'Échec du chargement de la classe',
      backToClasses: 'Retour à mes classes',
      viewingAsAdmin: 'Vue en tant qu’administrateur'
    }
  }
})

interface ClassPageLink {
  name: string
  icon: string
  labelKey: string
  /** Only an owner, a manager or a platform admin may open it. */
  managerOnly: boolean
}

/**
 * The five pages, in the order the banner lists them.
 *
 * One declaration drives three things — which links are drawn, which pages the
 * guard below turns away, and where a turned-away caller lands. A page cannot be
 * linked and unguarded, nor guarded and unreachable.
 */
const CLASS_PAGES: ClassPageLink[] = [
  { name: CLASS_PAGE_NAMES.live, icon: 'fas fa-play', labelKey: 'classLayout.pageLive', managerOnly: true },
  { name: CLASS_PAGE_NAMES.members, icon: 'fas fa-users', labelKey: 'classLayout.pageMembers', managerOnly: false },
  { name: CLASS_PAGE_NAMES.scenarios, icon: 'fas fa-clipboard-list', labelKey: 'classLayout.pageScenarios', managerOnly: true },
  { name: CLASS_PAGE_NAMES.analytics, icon: 'fas fa-chart-bar', labelKey: 'classLayout.pageAnalytics', managerOnly: true },
  { name: CLASS_PAGE_NAMES.settings, icon: 'fas fa-cog', labelKey: 'classLayout.pageSettings', managerOnly: true }
]

const group = ref<ClassGroup | null>(null)
const ownerUser = ref<User | null>(null)
const organization = ref<Organization | null>(null)
const isLoading = ref(true)
const error = ref('')
const membersLoaded = ref(false)
const memberCountDelta = ref(0)

const groupId = computed(() => (route.params.id as string) || '')
const subgroups = computed<ClassGroup[]>(() => group.value?.subGroups || group.value?.sub_groups || [])

const isOwner = computed(() => !!group.value && group.value.owner_user_id === currentUser.userId)

const groupMembers = useGroupMembers({
  groupId,
  currentUserId: computed(() => currentUser.userId),
  isOwner: computed(() => isPlatformAdmin.value || isOwner.value)
})

const isManager = computed(() => {
  const membership = groupMembers.members.value.find(member => member.user_id === currentUser.userId)
  return membership?.role === 'manager' || membership?.role === 'owner'
})

const canManageClass = computed(() => isPlatformAdmin.value || isOwner.value || isManager.value)
const canDeleteClass = computed(() => isPlatformAdmin.value || isOwner.value)

/**
 * Whether the caller's rights are settled.
 *
 * A platform admin and the class owner are proven by the class payload itself;
 * a manager can only be recognised by finding themselves in the roster, which
 * arrives later. Waiting for the roster in the first two cases would reserve an
 * owner's own pages for a round trip they do not need.
 */
const isRoleResolved = computed(() => isPlatformAdmin.value || isOwner.value || membersLoaded.value)

/**
 * The banner as the caller sees it. While the role is unsettled every link is
 * drawn, the privileged ones as inert placeholders in their final position, so
 * nothing appears under the cursor of a teacher already reaching for a page.
 */
const bannerPages = computed(() =>
  CLASS_PAGES
    .filter(page => !page.managerOnly || canManageClass.value || !isRoleResolved.value)
    .map(page => ({ ...page, reserved: page.managerOnly && !canManageClass.value }))
)

/**
 * Where a caller goes when the page they asked for is not theirs to open: the
 * first page they can, in the order the banner lists them. That is the live
 * class for a teacher and the roster for a learner — one rule, no special case.
 */
const fallbackPage = computed(() =>
  CLASS_PAGES.find(page => !page.managerOnly || canManageClass.value)
)

const memberCount = computed(() => {
  const roster = membersLoaded.value
    ? groupMembers.members.value.length
    : group.value?.member_count ?? 0
  return roster + memberCountDelta.value
})

const liveSessionCount = computed(() => teacherGroups.liveSessionCountOf(groupId.value))

/**
 * The class as the banner counts it: its APPRENANTS (issue #480), from the same
 * console payload the live count above comes from, so numerator and denominator
 * are computed over one population.
 *
 * The roster answers only for a backend that does not report the apprenants yet,
 * and for a class the caller merely attends — where the label is hidden anyway.
 * It counts the teaching staff, which is why it is the fallback and not the rule.
 */
const learnerCount = computed(() =>
  teacherGroups.learnerCountOf(groupId.value) ?? memberCount.value
)

/**
 * "7/12 connectés", or empty while the live count is unknown — for a class the
 * caller does not teach it stays unknown, since the console endpoint only
 * answers for the classes they manage. The slot is held either way.
 */
const connectedLabel = computed(() => {
  if (liveSessionCount.value === undefined || !group.value) return ''
  return t('classLayout.connected', { live: liveSessionCount.value, total: learnerCount.value })
})

const connectedPlaceholder = computed(() => t('classLayout.connected', { live: 0, total: 0 }))

async function loadClass(): Promise<void> {
  const data = await groupStore.getOne(groupId.value, ['ParentGroup', 'SubGroups'])
  group.value = data

  if (data.owner_user_id) {
    try {
      ownerUser.value = await userService.getUserById(data.owner_user_id)
    } catch (err) {
      console.error('Failed to load class owner:', err)
      ownerUser.value = null
    }
  }

  if (data.organization_id) {
    try {
      const response = await axios.get(`/organizations/${data.organization_id}`)
      organization.value = response.data
    } catch (err) {
      console.error('Failed to load class organization:', err)
      organization.value = null
    }
  }
}

async function loadRoster(): Promise<void> {
  try {
    await groupMembers.loadMembers(true, subgroups.value)
  } finally {
    membersLoaded.value = true
  }
}

/**
 * Refetches the class and its roster.
 *
 * It ends the loading state but never starts one: a page refreshing after it
 * saved the class must not replace what the teacher is looking at with a
 * spinner. Opening a class is the case where there IS nothing worth keeping, and
 * the two callers below say so by blanking the page themselves first.
 */
async function reload(): Promise<void> {
  error.value = ''
  memberCountDelta.value = 0

  try {
    await loadClass()
  } catch (err: any) {
    // A class the caller may not open is a wrong door, not a message to sit and
    // read: send them back to the console. Anything else — network, server —
    // stays on screen saying what happened.
    const status = err?.response?.status
    if (status === 403 || status === 404) {
      router.replace('/my-classes')
      return
    }
    error.value = err?.response?.data?.error_message || err?.message || t('classLayout.loadError')
    return
  } finally {
    isLoading.value = false
  }

  await loadRoster()
}

function applyMemberCountDelta(delta: number): void {
  // The roster behind the banner count is this layout's own fetch; a page adding
  // or removing a member changes ITS list, not this one. Carrying the difference
  // keeps the banner honest without refetching a roster for a number.
  memberCountDelta.value += delta

  // The apprenant count is core's to compute — a delta cannot know whether the
  // person just added is a learner or an assistant. useGroupMembers marks the
  // console cache stale on every membership change, so asking for it again is
  // what moves the banner's denominator; without this the class the teacher is
  // filling right now would keep answering with the count it opened on.
  teacherGroups.ensureLoaded(LIVE_COUNT_MAX_AGE_MS)
}

provideClassContext({
  groupId,
  group,
  subgroups,
  ownerUser,
  organization,
  memberCount,
  isPlatformAdmin,
  isOwner,
  isManager,
  canManageClass,
  canDeleteClass,
  reload,
  applyMemberCountDelta
})

/** Turns a caller away from a page their role does not open, once it is known. */
function enforcePageAccess(): void {
  if (!isRoleResolved.value) return

  const page = CLASS_PAGES.find(candidate => candidate.name === route.name)
  if (!page || !page.managerOnly || canManageClass.value) return

  router.replace(
    fallbackPage.value
      ? { name: fallbackPage.value.name, params: { id: groupId.value } }
      : '/my-classes'
  )
}

onMounted(async () => {
  if (!isEnabled('class_groups')) {
    router.push('/terminal-sessions')
    return
  }

  // `isLoading` already starts true: this is the first paint of the class.
  teacherGroups.ensureLoaded(LIVE_COUNT_MAX_AGE_MS)
  await reload()
})

// Another class entirely — subgroup links, the parent link, browser back and
// forward. Nothing of the class being left may survive into the one arriving,
// its name in the banner least of all.
watch(groupId, async () => {
  isLoading.value = true
  group.value = null
  ownerUser.value = null
  organization.value = null
  // The roster goes too, not just the flag: kept, it would answer "is the caller
  // a manager here?" about the class they just left, and briefly offer the
  // teaching pages of a class they only attend.
  membersLoaded.value = false
  groupMembers.members.value = []
  teacherGroups.ensureLoaded(LIVE_COUNT_MAX_AGE_MS)
  await reload()
})

watch([() => route.name, isRoleResolved, canManageClass], enforcePageAccess)
</script>

<template>
  <div class="class-layout">
    <!-- The only chrome every page of a class shares. -->
    <div class="class-banner">
      <div class="crumb">
        <router-link to="/my-classes" class="crumb-link">{{ t('classLayout.myClasses') }}</router-link>
        <span class="crumb-sep" aria-hidden="true">/</span>
        <strong v-if="group" class="crumb-current">{{ group.display_name }}</strong>
        <span v-else class="crumb-skeleton" :aria-label="t('classLayout.loading')"></span>

        <AdminBadge
          v-if="isPlatformAdmin && !isOwner && !isManager"
          :tooltip="t('classLayout.viewingAsAdmin')"
        />

        <!-- Always drawn, hidden until the count is known: the banner must not
             grow a line under the teacher once the console cache answers. -->
        <span class="banner-live" :class="{ 'is-pending': !connectedLabel }">
          <span class="banner-live-dot" aria-hidden="true"></span>
          {{ connectedLabel || connectedPlaceholder }}
        </span>
      </div>

      <nav class="class-nav" :aria-label="t('classLayout.navLabel')" :aria-busy="!isRoleResolved">
        <template v-for="page in bannerPages" :key="page.name">
          <span v-if="page.reserved" class="cnav cnav-reserved">
            <i :class="page.icon" aria-hidden="true"></i>
            {{ t(page.labelKey) }}
          </span>
          <router-link
            v-else
            class="cnav"
            :to="{ name: page.name, params: { id: groupId } }"
            :aria-current="route.name === page.name ? 'page' : undefined"
          >
            <i :class="page.icon" aria-hidden="true"></i>
            {{ t(page.labelKey) }}
          </router-link>
        </template>
      </nav>
    </div>

    <div v-if="isLoading" class="class-state">
      <i class="fas fa-spinner fa-spin"></i>
      {{ t('classLayout.loading') }}
    </div>

    <div v-else-if="error" class="class-state class-state-error">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <router-link to="/my-classes" class="btn btn-primary">
        {{ t('classLayout.backToClasses') }}
      </router-link>
    </div>

    <!--
      Keyed by class id so a page is torn down and rebuilt when the teacher moves
      to another class (subgroup links, browser back/forward). The pages load
      their data on mount only, and a class change is a param change, which by
      itself reuses the page component. The load below does blank the page in
      passing, but only when it is slow enough to paint — the key is what makes
      the rebuild independent of that timing.
    -->
    <div v-else-if="group" class="class-page">
      <router-view :key="groupId" />
    </div>
  </div>
</template>

<style scoped>
.class-layout {
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.class-banner {
  border-bottom: var(--border-width-thin) solid var(--color-border-light);
  padding-bottom: var(--spacing-sm);
}

.crumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-md);
  flex-wrap: wrap;
}

.crumb-link {
  color: var(--color-primary);
  text-decoration: none;
}

.crumb-link:hover {
  text-decoration: underline;
}

.crumb-sep {
  color: var(--color-text-muted);
}

.crumb-current {
  color: var(--color-text-primary);
}

/* Holds the class name's line while it loads, so the banner never grows. */
.crumb-skeleton {
  display: inline-block;
  width: 12rem;
  height: 1em;
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-tertiary);
}

.banner-live {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-left: auto;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success-text);
  font-variant-numeric: tabular-nums;
}

/* Reserved, not removed: the slot keeps its width while the count is unknown. */
.banner-live.is-pending {
  visibility: hidden;
}

.banner-live-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--border-radius-full);
  background: var(--color-success);
}

.class-nav {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
  flex-wrap: wrap;
}

.cnav {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: background-color var(--transition-base);
}

.cnav:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.cnav:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Styled off the ARIA state so what the page announces and what it looks like
   cannot drift apart. */
.cnav[aria-current='page'] {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

/* A page whose availability is still being determined: it holds its final
   position but must not read or behave as usable yet. */
.cnav-reserved,
.cnav-reserved:hover {
  color: var(--color-text-muted);
  opacity: 0.55;
  background: none;
  cursor: default;
}

.class-page {
  padding: var(--spacing-md) 0;
}

.class-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.class-state i {
  font-size: var(--font-size-2xl);
  color: var(--color-primary);
}

.class-state-error i {
  color: var(--color-danger);
}

@media (max-width: 768px) {
  .class-layout {
    padding: var(--spacing-md);
  }

  .banner-live {
    margin-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cnav {
    transition: none;
  }
}
</style>
