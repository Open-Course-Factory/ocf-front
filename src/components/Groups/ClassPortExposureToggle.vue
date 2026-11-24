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

<script setup lang="ts">
/**
 * Switches the watched scenario's public port exposure from the class view.
 * It is the scenario's own setting, the lab editor's « Exposition publique de
 * ports »: it applies to every class running the scenario.
 */
import { ref, watch } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useNotification } from '../../composables/useNotification'
import { extractErrorMessage } from '../../utils/formatters'
import { scenarioSessionService, teacherService } from '../../services/domain/scenario'

const props = defineProps<{
  scenarioId: string
}>()

const { t } = useTranslations({
  en: {
    classPortExposure: {
      on: 'Public ports: on',
      off: 'Public ports: off',
      changeError: 'Could not change public port exposure',
      hint: 'Applies to every class running this scenario. Learners must reload their page to see the Ports button.'
    }
  },
  fr: {
    classPortExposure: {
      on: 'Ports publics : activés',
      off: 'Ports publics : désactivés',
      changeError: 'Impossible de changer l’exposition publique des ports',
      hint: 'S’applique à toutes les classes qui suivent ce scénario. Les apprenants doivent recharger leur page pour voir le bouton Ports.'
    }
  }
})
const { showError } = useNotification()

/** null until the scenario is read: the button stays in place, disabled. */
const allowed = ref<boolean | null>(null)

async function loadSetting() {
  allowed.value = null
  try {
    const scenario = await scenarioSessionService.getScenario(props.scenarioId)
    allowed.value = !!scenario.port_exposure_allowed
  } catch {
    // Unreadable: the button stays disabled rather than guess.
  }
}

watch(() => props.scenarioId, loadSetting, { immediate: true })

const busy = ref(false)

// Only reachable once the setting is read and no change is under way: the
// button is disabled otherwise.
async function toggle() {
  busy.value = true
  try {
    allowed.value = await teacherService.setPortExposure(props.scenarioId, !allowed.value)
  } catch (err: any) {
    showError(extractErrorMessage(err, t('classPortExposure.changeError')))
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="ocf-btn ocf-btn-secondary ocf-btn-sm"
    data-testid="class-port-exposure-toggle"
    :aria-pressed="allowed === true"
    :disabled="allowed === null || busy"
    :title="t('classPortExposure.hint')"
    @click="toggle"
  >
    <i class="fas fa-globe" aria-hidden="true"></i>
    {{ allowed ? t('classPortExposure.on') : t('classPortExposure.off') }}
  </button>
</template>

<style scoped>
/* "On" reads at a glance, as the active filter chips beside it do. */
.ocf-btn[aria-pressed='true'] {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}
</style>
