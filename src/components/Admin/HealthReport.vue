<script setup lang="ts" generic="T extends HealthReportItem">
/**
 * The shell every health report shares: a title, a refresh button, the
 * loading / error / all-clear states, the blocking count, and one card per
 * item with its findings. The page owns what only it can know — the endpoint,
 * the sentence for each finding code, the card's own header and detail line —
 * and hands them in as a loader and slots.
 *
 * A report shows nothing when there is nothing wrong. A report that lists its
 * own good news is one people stop reading, and then stop believing.
 */
import { ref, onMounted, computed, type Ref } from 'vue'

export interface HealthFinding {
  code: string
  severity: string
}

export interface HealthReportItem {
  findings: HealthFinding[]
}

export interface HealthReportLabels {
  title: string
  subtitle: string
  refresh: string
  allWell: string
  allWellHint: string
  loadError: string
  /** Label per severity value; a severity with no label falls back to `warning`. */
  severity: { blocking: string; warning: string } & Record<string, string>
}

const props = withDefaults(
  defineProps<{
    labels: HealthReportLabels
    load: () => Promise<T[]>
    itemKey: (item: T) => string
    /**
     * Whether to count warnings beside the blocking findings. Advisories are
     * never counted: they are not faults, and counting them would overstate
     * how much is wrong on a page an operator opens to triage.
     */
    countWarnings?: boolean
  }>(),
  { countWarnings: false }
)

defineSlots<{
  'card-header'(props: { item: T }): unknown
  'card-meta'(props: { item: T }): unknown
  finding(props: { finding: T['findings'][number]; item: T }): unknown
}>()

// A generic ref needs the cast: ref() unwraps T into UnwrapRef<T>, which is
// not assignable back to T for an arbitrary T.
const report = ref([]) as Ref<T[]>
const loading = ref(true)
const error = ref('')

function countSeverity(severity: string): number {
  return report.value.reduce(
    (total, item) => total + item.findings.filter((f) => f.severity === severity).length,
    0
  )
}

const blockingCount = computed(() => countSeverity('blocking'))
const warningCount = computed(() => countSeverity('warning'))

function severityLabel(severity: string): string {
  return props.labels.severity[severity] ?? props.labels.severity.warning
}

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    report.value = (await props.load()) || []
  } catch (e: any) {
    error.value = e?.response?.data?.error_message || props.labels.loadError
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>

<template>
  <div class="ocf-health">
    <header class="ocf-health-header">
      <div>
        <h1>{{ labels.title }}</h1>
        <p class="ocf-health-subtitle">{{ labels.subtitle }}</p>
      </div>
      <button class="btn btn-outline-secondary" :disabled="loading" @click="refresh">
        <i class="fas fa-rotate" /> {{ labels.refresh }}
      </button>
    </header>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="loading" class="ocf-health-loading">
      <i class="fas fa-circle-notch fa-spin" />
    </div>

    <div v-else-if="report.length === 0" class="ocf-health-clear">
      <i class="fas fa-circle-check" />
      <p class="ocf-health-clear-title">{{ labels.allWell }}</p>
      <p class="ocf-health-clear-hint">{{ labels.allWellHint }}</p>
    </div>

    <template v-else>
      <!-- Two count lines rather than one with an optional tail: a conditional
           tail leaves a whitespace text node after the blocking label, and the
           pages' rendered text is pinned byte for byte. -->
      <p v-if="countWarnings" class="ocf-health-count">
        <span class="ocf-health-badge ocf-health-badge-blocking">{{ blockingCount }}</span>
        {{ labels.severity.blocking }}
        <template v-if="warningCount > 0">
          &nbsp;·&nbsp;
          <span class="ocf-health-badge ocf-health-badge-warning">{{ warningCount }}</span>
          {{ labels.severity.warning }}
        </template>
      </p>
      <p v-else class="ocf-health-count">
        <span class="ocf-health-badge ocf-health-badge-blocking">{{ blockingCount }}</span>
        {{ labels.severity.blocking }}
      </p>

      <article v-for="item in report" :key="itemKey(item)" class="ocf-health-card">
        <header class="ocf-health-card-header">
          <slot name="card-header" :item="item" />
        </header>

        <slot name="card-meta" :item="item" />

        <ul class="ocf-health-findings">
          <li v-for="(finding, index) in item.findings" :key="index" class="ocf-health-finding">
            <span
              class="ocf-health-severity"
              :class="`ocf-health-severity-${finding.severity}`"
            >{{ severityLabel(finding.severity) }}</span>
            <span class="ocf-health-sentence"><slot name="finding" :finding="finding" :item="item" /></span>
          </li>
        </ul>
      </article>
    </template>
  </div>
</template>

<style scoped>
/* `ocf-` on every class: Bootstrap is loaded globally here and a bare .card or
   .badge would take its styling from it. */
.ocf-health {
  padding: 1.5rem;
  max-width: 60rem;
}

.ocf-health-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.ocf-health-header h1 {
  font-size: 1.5rem;
  margin: 0 0 0.35rem;
  color: var(--color-text);
}

.ocf-health-subtitle {
  margin: 0;
  max-width: 46rem;
  color: var(--color-text-secondary);
}

.ocf-health-loading {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.ocf-health-clear {
  padding: 3rem 1.5rem;
  text-align: center;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-background-soft);
}

.ocf-health-clear i {
  font-size: 2rem;
  color: var(--color-success);
}

.ocf-health-clear-title {
  margin: 0.75rem 0 0.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.ocf-health-clear-hint {
  margin: 0;
  color: var(--color-text-secondary);
}

.ocf-health-count {
  margin-bottom: 1rem;
  color: var(--color-text-secondary);
}

.ocf-health-badge {
  display: inline-block;
  min-width: 1.6rem;
  padding: 0.1rem 0.45rem;
  border-radius: 1rem;
  text-align: center;
  font-weight: 600;
  color: var(--color-background);
}

.ocf-health-badge-blocking {
  background: var(--color-danger);
}

.ocf-health-badge-warning {
  background: var(--color-warning);
}

.ocf-health-card {
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  background: var(--color-background-soft);
}

.ocf-health-card-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Slot content is compiled in the page's scope, so the shell reaches it
   through :slotted(). Pages add their own variants on top (a red "deleted"
   tag, say) in their own scoped style. */
.ocf-health-card-header :slotted(h2) {
  font-size: 1.05rem;
  margin: 0;
  color: var(--color-text);
}

:slotted(.ocf-health-tag) {
  font-size: 0.75rem;
  padding: 0.1rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

:slotted(.ocf-health-meta) {
  margin: 0.4rem 0 0.75rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.ocf-health-findings {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ocf-health-finding {
  display: flex;
  gap: 0.65rem;
  align-items: baseline;
  padding: 0.4rem 0;
  border-top: 1px solid var(--color-border);
}

.ocf-health-severity {
  flex: 0 0 auto;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  white-space: nowrap;
}

.ocf-health-severity-blocking {
  background: var(--color-danger);
  color: var(--color-background);
}

.ocf-health-severity-warning {
  background: var(--color-warning);
  color: var(--color-background);
}

/* An advisory is not a fault. It reads as information, not as an alarm. */
.ocf-health-severity-advisory {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.ocf-health-sentence {
  color: var(--color-text);
}
</style>
