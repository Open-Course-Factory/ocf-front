<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTranslations } from '../../../composables/useTranslations'
import { useToast } from '../../../composables/useToast'
import { extractErrorMessage } from '../../../utils/formatters'
import { localMachineBootService } from '../../../services/domain/admin/localMachineBootService'
import type { MachineBoot } from '../../../services/domain/scenario/scenarioSessionService'
import SettingsCard from '../../UI/SettingsCard.vue'
import Button from '../../UI/Button.vue'
import ErrorAlert from '../../UI/ErrorAlert.vue'
import AdminBadge from '../../Common/AdminBadge.vue'

const { t } = useTranslations({
  en: { unkernel: {
    title: 'unkernel integration',
    description: 'How a machine that runs in the learner\'s browser boots, for every scenario that does not say otherwise. Its CPUs and memory come from the size of its scenario.',
    jit: 'JIT compiler',
    jitHint: 'Faster: the code the machine runs often is compiled to WebAssembly.',
    verbose: 'Verbose boot',
    verboseHint: 'Every kernel message is shown in the console.',
    display: 'Display',
    displayHint: 'A screen for graphical programs.',
    sound: 'Sound card',
    consoleHidden: 'Hide the console once the machine has booted',
    consoleHiddenHint: 'On a desktop only. Learners get the desktop only when the local_machine_desktop feature flag is on.',
    append: 'Kernel command line',
    appendHint: 'Empty: the kernel\'s own command line.',
    appendWarning: 'A wrong command line can stop every machine from booting. Change it only if you know what each option does.',
    save: 'Save',
    saved: 'Boot settings saved. They apply to machines that boot from now on.',
    loadError: 'Unable to load the boot settings. Reload this page before editing them.',
    saveError: 'Unable to save the boot settings.'
  } },
  fr: { unkernel: {
    title: 'Intégration unkernel',
    description: 'Comment démarre une machine qui tourne dans le navigateur de l\'apprenant, pour tout scénario qui ne dit pas autre chose. Ses processeurs et sa mémoire viennent de la taille de son scénario.',
    jit: 'Compilateur JIT',
    jitHint: 'Plus rapide : le code que la machine exécute souvent est compilé en WebAssembly.',
    verbose: 'Démarrage détaillé',
    verboseHint: 'La console affiche chaque message du noyau.',
    display: 'Écran',
    displayHint: 'Un écran pour les programmes graphiques.',
    sound: 'Carte son',
    consoleHidden: 'Masquer la console une fois la machine démarrée',
    consoleHiddenHint: 'Sur un bureau seulement. Les apprenants n\'ont le bureau que si le feature flag local_machine_desktop est activé.',
    append: 'Ligne de commande du noyau',
    appendHint: 'Vide : la ligne de commande propre au noyau.',
    appendWarning: 'Une ligne de commande erronée peut empêcher toutes les machines de démarrer. Ne la modifiez que si vous savez ce que fait chaque option.',
    save: 'Enregistrer',
    saved: 'Réglages de démarrage enregistrés. Ils s\'appliquent aux machines qui démarrent à partir de maintenant.',
    loadError: 'Impossible de charger les réglages de démarrage. Rechargez la page avant de les modifier.',
    saveError: 'Impossible d\'enregistrer les réglages de démarrage.'
  } }
})
const toast = useToast()

const FLAGS = [
  { key: 'jit', label: 'unkernel.jit', hint: 'unkernel.jitHint' },
  { key: 'verbose', label: 'unkernel.verbose', hint: 'unkernel.verboseHint' },
  { key: 'display', label: 'unkernel.display', hint: 'unkernel.displayHint' },
  { key: 'sound', label: 'unkernel.sound', hint: '' },
  { key: 'console_hidden', label: 'unkernel.consoleHidden', hint: 'unkernel.consoleHiddenHint' }
] as const

const draft = ref<MachineBoot | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

onMounted(async () => {
  try { draft.value = await localMachineBootService.getDefaults() }
  catch { error.value = t('unkernel.loadError') }
  finally { loading.value = false }
})

async function save() {
  if (!draft.value) return
  saving.value = true
  error.value = ''
  try {
    draft.value = await localMachineBootService.saveDefaults(draft.value)
    toast.success(t('unkernel.saved'))
  } catch (err) {
    // ocf-core says what it refused (an unusable command line).
    error.value = extractErrorMessage(err, t('unkernel.saveError'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="ocf-unkernel-settings">
    <SettingsCard :title="t('unkernel.title')" icon="fas fa-microchip">
      <template #headerActions><AdminBadge /></template>
      <p>{{ t('unkernel.description') }}</p>
      <ErrorAlert :message="error" @dismiss="error = ''" />
      <form v-if="draft" data-testid="unkernel-boot-form" @submit.prevent="save">
        <fieldset :disabled="saving" class="ocf-unkernel-fieldset">
          <div v-for="flag in FLAGS" :key="flag.key" class="form-group">
            <label class="checkbox-label">
              <input v-model="draft[flag.key]" type="checkbox" :data-testid="`unkernel-${flag.key}`" />
              <span>{{ t(flag.label) }}</span>
            </label>
            <small v-if="flag.hint" class="form-text">{{ t(flag.hint) }}</small>
          </div>
          <div class="form-group">
            <label for="unkernel-append">{{ t('unkernel.append') }}</label>
            <input id="unkernel-append" v-model.trim="draft.append" class="form-control" maxlength="512" data-testid="unkernel-append" aria-describedby="unkernel-append-warning" />
            <small class="form-text">{{ t('unkernel.appendHint') }}</small>
            <p id="unkernel-append-warning" class="alert alert-warning">
              <i class="fas fa-exclamation-triangle"></i> {{ t('unkernel.appendWarning') }}
            </p>
          </div>
          <Button type="submit" variant="primary" :loading="saving" data-testid="unkernel-save">{{ t('unkernel.save') }}</Button>
        </fieldset>
      </form>
      <p v-else-if="loading" role="status"><i class="fas fa-spinner fa-spin"></i></p>
    </SettingsCard>
  </section>
</template>

<style scoped>
.ocf-unkernel-settings { max-width: 48rem; padding: var(--spacing-lg); }
.ocf-unkernel-fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
</style>
