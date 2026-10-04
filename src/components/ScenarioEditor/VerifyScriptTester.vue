<!--
  "Test this check": runs the verify script as it stands in the editor, saved
  or not, on the author's own preview of the scenario, and shows what a learner
  would get. The preview does not move: nothing is validated, nothing counted.

  Without a running preview it asks the page to start one (the page owns the
  "Play as learner" flow) and runs the test once the page hands the new
  session back through `startedPreviewId`.
-->
<template>
  <div class="ocf-verify-tester">
    <div class="ocf-verify-tester-bar">
      <button
        type="button"
        class="btn btn-sm btn-outline-primary"
        data-testid="verify-test-run"
        :disabled="disabled || busy || !script.trim()"
        :title="disabled ? t('verifyTester.readOnly') : undefined"
        @click="runTest"
      >
        <i :class="busy ? 'fas fa-spinner fa-spin' : 'fas fa-vial'" aria-hidden="true"></i>
        {{ t('verifyTester.run') }}
      </button>
    </div>

    <!-- Reserved: the same height whatever it shows, so nothing moves. -->
    <div class="ocf-verify-tester-result" data-testid="verify-test-result" aria-live="polite">
      <p v-if="state === 'idle'" class="ocf-verify-tester-hint">{{ t('verifyTester.hint') }}</p>
      <p v-else-if="state === 'running'" class="ocf-verify-tester-hint">{{ t('verifyTester.running') }}</p>
      <p v-else-if="state === 'provisioning'" class="ocf-verify-tester-hint">{{ t('verifyTester.provisioning') }}</p>
      <div v-else-if="state === 'noPreview'" class="ocf-verify-tester-hint">
        <p>{{ t('verifyTester.noPreview') }}</p>
        <button type="button" class="btn btn-sm btn-outline-primary" data-testid="verify-test-start-preview" @click="emit('start-preview')">
          <i class="fas fa-play" aria-hidden="true"></i> {{ t('verifyTester.startPreview') }}
        </button>
      </div>
      <p v-else-if="state === 'error'" class="ocf-verify-tester-error" data-testid="verify-test-error">{{ t(`verifyTester.${errorKey}`) }}</p>
      <template v-else-if="result">
        <p class="ocf-verify-tester-summary">
          <span class="ocf-verify-tester-badge" :class="result.passed ? 'is-passed' : 'is-failed'" data-testid="verify-test-verdict">
            <i :class="result.passed ? 'fas fa-check' : 'fas fa-times'" aria-hidden="true"></i>
            {{ result.passed ? t('verifyTester.passed') : t('verifyTester.failed') }}
          </span>
          <span>{{ t('verifyTester.exitCode', { code: result.exit_code }) }}</span>
          <span>{{ t('verifyTester.duration', { ms: result.duration_ms }) }}</span>
        </p>
        <pre class="ocf-verify-tester-output" data-testid="verify-test-output">{{ result.output || t('verifyTester.noOutput') }}</pre>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { scenarioSessionService, pollProvisioningStatus, type TestVerifyResponse } from '../../services/domain/scenario/scenarioSessionService'
import { testVerifyRefusalKey } from '../../utils/scenarioPreview'

const { t } = useTranslations({
  en: {
    verifyTester: {
      run: 'Test this check',
      hint: 'Runs the script above on your preview of this scenario, as it would run for a learner. Your preview does not move forward.',
      running: 'Running the check on your preview…',
      provisioning: 'Your preview is starting; the check runs as soon as it is ready…',
      noPreview: 'No preview of this scenario is running. Start one to test this check on it: you stay in the editor.',
      startPreview: 'Start a preview',
      passed: 'Passed',
      failed: 'Failed',
      exitCode: 'exit code {code}',
      duration: '{ms} ms',
      noOutput: '(no output)',
      readOnly: 'This scenario is read only: its checks cannot be tested from here.',
      errorForbidden: 'Checks can only be tested on your own preview of a scenario you can edit.',
      errorTooLarge: 'This script is too large to test (64 KB at most).',
      errorRateLimited: 'Too many checks in a short time. Wait a minute, then try again.',
      errorTimeout: 'The preview did not answer in time. Check that its terminal is still running, then try again.',
      errorFailed: 'The check could not be run. A script running longer than 10 seconds is stopped; otherwise, try again.',
      errorPreviewFailed: 'Your preview could not be started, so the check was not run.'
    }
  },
  fr: {
    verifyTester: {
      run: 'Tester cette vérification',
      hint: "Exécute le script ci-dessus sur votre aperçu de ce scénario, comme pour un apprenant. Votre aperçu n'avance pas.",
      running: 'Vérification en cours sur votre aperçu…',
      provisioning: 'Votre aperçu démarre ; la vérification sera lancée dès qu’il sera prêt…',
      noPreview: "Aucun aperçu de ce scénario n'est en cours. Lancez-en un pour y tester cette vérification : vous restez dans l'éditeur.",
      startPreview: 'Lancer un aperçu',
      passed: 'Réussie',
      failed: 'Échouée',
      exitCode: 'code de sortie {code}',
      duration: '{ms} ms',
      noOutput: '(aucune sortie)',
      readOnly: 'Ce scénario est en lecture seule : ses vérifications ne peuvent pas être testées ici.',
      errorForbidden: "Une vérification ne se teste que sur votre propre aperçu d'un scénario que vous pouvez modifier.",
      errorTooLarge: 'Ce script est trop volumineux pour être testé (64 Ko au maximum).',
      errorRateLimited: 'Trop de vérifications en peu de temps. Attendez une minute, puis réessayez.',
      errorTimeout: "L'aperçu n'a pas répondu à temps. Vérifiez que son terminal tourne toujours, puis réessayez.",
      errorFailed: "La vérification n'a pas pu être exécutée. Un script qui dure plus de 10 secondes est interrompu ; sinon, réessayez.",
      errorPreviewFailed: "Votre aperçu n'a pas pu démarrer : la vérification n'a pas été lancée."
    }
  }
})

const props = withDefaults(defineProps<{
  scenarioId: string
  script: string
  /** A preview the page has just started for this test, still provisioning maybe. */
  startedPreviewId?: string | null
  disabled?: boolean
}>(), {
  startedPreviewId: null,
  disabled: false
})

const emit = defineEmits<{ (e: 'start-preview'): void }>()

type State = 'idle' | 'running' | 'provisioning' | 'noPreview' | 'error' | 'done'
const state = ref<State>('idle')
const result = ref<TestVerifyResponse | null>(null)
const errorKey = ref('')
const busy = computed(() => state.value === 'running' || state.value === 'provisioning')
const abort = new AbortController()
onBeforeUnmount(() => abort.abort())

/**
 * The author's open preview of this scenario. A user holds one open run per
 * scenario, and ocf-core decides whether it may still be returned to.
 */
async function findPreview() {
  const sessions = await scenarioSessionService.getMyScenarioSessions()
  return sessions.find(s => s.scenario_id === props.scenarioId && s.resumable && s.is_preview !== false) ?? null
}

async function waitUntilReady(sessionId: string) {
  state.value = 'provisioning'
  await pollProvisioningStatus(sessionId, undefined, abort.signal)
}

async function testOn(sessionId: string) {
  state.value = 'running'
  try {
    result.value = await scenarioSessionService.testVerifyScript(sessionId, props.script)
    state.value = 'done'
  } catch (err: any) {
    const key = testVerifyRefusalKey(err?.response?.status, err?.code)
    if (key === 'noPreview') {
      state.value = 'noPreview'
      return
    }
    errorKey.value = key
    state.value = 'error'
  }
}

async function runTest() {
  state.value = 'running'
  let preview
  try {
    preview = await findPreview()
    if (preview?.status === 'provisioning') await waitUntilReady(preview.id)
  } catch {
    errorKey.value = 'errorFailed'
    state.value = 'error'
    return
  }
  if (preview) await testOn(preview.id)
  else state.value = 'noPreview'
}

watch(() => props.startedPreviewId, async id => {
  if (!id) return
  try {
    await waitUntilReady(id)
  } catch {
    errorKey.value = 'errorPreviewFailed'
    state.value = 'error'
    return
  }
  await testOn(id)
})
</script>

<style scoped>
.ocf-verify-tester {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.ocf-verify-tester-bar {
  display: flex;
  justify-content: flex-end;
}

.ocf-verify-tester-result {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  height: 11rem;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-secondary);
  font-size: var(--font-size-sm);
  overflow: hidden;
}

.ocf-verify-tester-hint,
.ocf-verify-tester-hint p {
  margin: 0;
  color: var(--color-text-secondary);
}

.ocf-verify-tester-hint {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-xs);
}

.ocf-verify-tester-error {
  margin: 0;
  color: var(--color-danger);
}

.ocf-verify-tester-summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: 0;
  color: var(--color-text-secondary);
}

.ocf-verify-tester-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0.1rem 0.5rem;
  border-radius: var(--border-radius-full);
  font-weight: 600;
}

.ocf-verify-tester-badge.is-passed {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.ocf-verify-tester-badge.is-failed {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.ocf-verify-tester-output {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: var(--spacing-sm);
  overflow: auto;
  border-radius: var(--border-radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: monospace;
  font-size: 0.8rem;
  white-space: pre-wrap;
}

</style>
