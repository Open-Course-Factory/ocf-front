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
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { useTranslations } from '../../composables/useTranslations'
import { CLASS_PAGE_NAMES } from '../../router/classPages'
import type { ClassGroup } from '../../types/group'
import type { OrganizationMember } from '../../types/organization'

const props = defineProps<{ organizationId: string }>()

const { t, locale } = useTranslations({
  en: {
    qualiopi: {
      title: 'Training evidence',
      intro: 'Reports are built from live data. Print them before the data below is deleted: this page cannot tell whether you did.',
      commandsNote: 'Command history can be deleted sooner, depending on the plan used by each session.',
      loadError: 'Could not load this page.',
      erasuresTitle: 'Coming erasures',
      noErasure: 'No departed member is waiting for erasure.',
      member: 'Member',
      erasedOn: 'Erased on',
      soon: 'In less than {days} days',
      classesOfMember: 'Their classes',
      noClass: 'None',
      classesTitle: 'Classes',
      noClasses: 'This organization has no class.',
      className: 'Class',
      courseDays: 'Course days',
      lastCourseDay: 'Last day',
      noCourseDays: 'Not set: the report will include every day with activity',
      report: 'Report',
      openReport: 'Open the report of {name}'
    }
  },
  fr: {
    qualiopi: {
      title: 'Preuves de formation',
      intro: "Les rapports sont construits à partir des données en cours. Imprimez-les avant la suppression des données ci-dessous : cette page ne peut pas savoir si vous l'avez fait.",
      commandsNote: "L'historique des commandes peut être supprimé plus tôt, selon le plan utilisé par chaque session.",
      loadError: 'Impossible de charger cette page.',
      erasuresTitle: 'Effacements à venir',
      noErasure: "Aucun membre parti n'attend d'effacement.",
      member: 'Membre',
      erasedOn: 'Effacé le',
      soon: 'Dans moins de {days} jours',
      classesOfMember: 'Ses classes',
      noClass: 'Aucune',
      classesTitle: 'Classes',
      noClasses: "Cette organisation n'a aucune classe.",
      className: 'Classe',
      courseDays: 'Jours de formation',
      lastCourseDay: 'Dernier jour',
      noCourseDays: "Non définis : le rapport inclura tous les jours avec de l'activité",
      report: 'Rapport',
      openReport: 'Ouvrir le rapport de {name}'
    }
  }
})

const SOON_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

const members = ref<OrganizationMember[]>([])
const classes = ref<ClassGroup[]>([])
const isLoading = ref(true)
const loadFailed = ref(false)

onMounted(async () => {
  try {
    const [membersResponse, classesResponse] = await Promise.all([
      axios.get(`/organizations/${props.organizationId}/members`, { params: { include: 'User' } }),
      axios.get(`/organizations/${props.organizationId}/groups`, { params: { includes: 'Members' } })
    ])
    members.value = membersResponse.data
    classes.value = classesResponse.data
  } catch {
    loadFailed.value = true
  } finally {
    isLoading.value = false
  }
})

const lastCourseDayOf = (group: ClassGroup) => [...(group.course_days ?? [])].sort().pop() ?? ''

const classesByLastCourseDay = computed(() =>
  [...classes.value].sort((a, b) => lastCourseDayOf(b).localeCompare(lastCourseDayOf(a)))
)

const comingErasures = computed(() =>
  members.value
    .filter(member => member.scheduled_erasure_at)
    .sort((a, b) => a.scheduled_erasure_at!.localeCompare(b.scheduled_erasure_at!))
    .map(member => ({
      member,
      classes: classes.value.filter(group => group.members?.some(m => m.user_id === member.user_id))
    }))
)

const isSoon = (date: string) => new Date(date).getTime() - Date.now() < SOON_DAYS * DAY_MS
const formatDay = (date: string) => new Date(date).toLocaleDateString(locale.value)
const classNameOf = (group: ClassGroup) => group.display_name || group.name
const nameOf = (member: OrganizationMember) =>
  member.user?.display_name || member.user?.name || member.user?.email || member.user_id
const reportRoute = (group: ClassGroup) => ({ name: CLASS_PAGE_NAMES.participation, params: { id: group.id } })
</script>

<template>
  <div class="ocf-qualiopi">
    <h2 class="ocf-qualiopi-title">{{ t('qualiopi.title') }}</h2>
    <p>{{ t('qualiopi.intro') }}</p>
    <p class="ocf-qualiopi-note">{{ t('qualiopi.commandsNote') }}</p>

    <div v-if="isLoading" class="ocf-qualiopi-loading"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i></div>
    <p v-else-if="loadFailed" class="ocf-qualiopi-warning" role="alert">{{ t('qualiopi.loadError') }}</p>

    <template v-else>
      <section>
        <h3>{{ t('qualiopi.erasuresTitle') }}</h3>
        <p v-if="comingErasures.length === 0">{{ t('qualiopi.noErasure') }}</p>
        <table v-else class="ocf-qualiopi-table">
          <thead>
            <tr>
              <th scope="col">{{ t('qualiopi.member') }}</th>
              <th scope="col">{{ t('qualiopi.erasedOn') }}</th>
              <th scope="col">{{ t('qualiopi.classesOfMember') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="erasure in comingErasures" :key="erasure.member.id">
              <td>{{ nameOf(erasure.member) }}</td>
              <td>
                {{ formatDay(erasure.member.scheduled_erasure_at!) }}
                <span v-if="isSoon(erasure.member.scheduled_erasure_at!)" class="ocf-qualiopi-warning">
                  <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                  {{ t('qualiopi.soon', { days: SOON_DAYS }) }}
                </span>
              </td>
              <td>
                <span v-if="erasure.classes.length === 0">{{ t('qualiopi.noClass') }}</span>
                <router-link
                  v-for="group in erasure.classes"
                  :key="group.id"
                  :to="reportRoute(group)"
                  class="ocf-qualiopi-class-link"
                >{{ classNameOf(group) }}</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3>{{ t('qualiopi.classesTitle') }}</h3>
        <p v-if="classes.length === 0">{{ t('qualiopi.noClasses') }}</p>
        <table v-else class="ocf-qualiopi-table">
          <thead>
            <tr>
              <th scope="col">{{ t('qualiopi.className') }}</th>
              <th scope="col">{{ t('qualiopi.courseDays') }}</th>
              <th scope="col">{{ t('qualiopi.lastCourseDay') }}</th>
              <th scope="col">{{ t('qualiopi.report') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in classesByLastCourseDay" :key="group.id" data-test="qualiopi-class">
              <td>{{ classNameOf(group) }}</td>
              <template v-if="group.course_days?.length">
                <td>{{ group.course_days.length }}</td>
                <td>{{ formatDay(lastCourseDayOf(group)) }}</td>
              </template>
              <td v-else colspan="2" class="ocf-qualiopi-warning">
                <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                {{ t('qualiopi.noCourseDays') }}
              </td>
              <td>
                <router-link :to="reportRoute(group)" :aria-label="t('qualiopi.openReport', { name: classNameOf(group) })">
                  {{ t('qualiopi.report') }}
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<style scoped>
.ocf-qualiopi-title {
  margin-top: 0;
}

.ocf-qualiopi-note {
  color: var(--color-text-secondary);
}

.ocf-qualiopi-loading {
  padding: var(--spacing-lg);
  text-align: center;
}

.ocf-qualiopi section {
  margin-top: var(--spacing-lg);
}

.ocf-qualiopi-table {
  width: 100%;
  border-collapse: collapse;
}

.ocf-qualiopi-table th,
.ocf-qualiopi-table td {
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-light);
  text-align: left;
}

.ocf-qualiopi-warning {
  color: var(--color-warning-text);
}

.ocf-qualiopi-class-link {
  display: inline-block;
  margin-right: var(--spacing-sm);
}
</style>
