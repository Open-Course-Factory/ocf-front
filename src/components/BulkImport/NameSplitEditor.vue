<template>
  <div class="ocf-name-split">
    <div class="ocf-name-split-header">
      <h4 class="ocf-name-split-title">{{ t('nameSplit.title') }}</h4>
      <label class="ocf-name-split-order">
        <span>{{ t('nameSplit.orderLabel') }}</span>
        <select class="ocf-name-split-order-select" :value="plan.order" @change="onOrderChange">
          <option value="last_first">{{ t('nameSplit.lastFirst') }}</option>
          <option value="first_last">{{ t('nameSplit.firstLast') }}</option>
        </select>
      </label>
    </div>
    <p class="ocf-name-split-hint">{{ t('nameSplit.hint') }}</p>

    <ul class="ocf-name-split-rows">
      <li
        v-for="{ row, split } in splits"
        :key="row.index"
        class="ocf-name-split-row"
        :class="{ 'is-adjusted': split.adjusted }"
        :data-row="row.index"
      >
        <div class="ocf-name-split-words">
          <template v-for="(word, position) in split.words" :key="position">
            <button
              v-if="position > 0"
              type="button"
              class="ocf-name-split-cut"
              :class="{ 'is-active': position === split.cut }"
              :aria-label="t('nameSplit.cutHere')"
              :aria-pressed="position === split.cut"
              @click="setCut(row.index, position, split)"
            ></button>
            <span class="ocf-name-split-word" :class="sideClass(position, split)">{{ word }}</span>
          </template>
        </div>

        <div class="ocf-name-split-result">
          <span class="ocf-name-split-last">
            <span class="ocf-name-split-result-label">{{ t('nameSplit.lastName') }}</span>
            {{ split.lastName }}
          </span>
          <span class="ocf-name-split-first" :class="{ 'is-flag': split.words.length < 2 }">
            <span class="ocf-name-split-result-label">{{ t('nameSplit.firstName') }}</span>
            {{ split.words.length < 2 ? t('nameSplit.singleWord') : split.firstName }}
          </span>
        </div>

        <div class="ocf-name-split-actions">
          <button
            type="button"
            class="ocf-name-split-action ocf-name-split-swap"
            :disabled="split.words.length < 2"
            @click="swapSides(row.index, split)"
          >
            {{ t('nameSplit.swap') }}
          </button>
          <button
            type="button"
            class="ocf-name-split-action ocf-name-split-reset"
            :disabled="!split.adjusted"
            @click="resetRow(row.index)"
          >
            {{ t('nameSplit.reset') }}
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import {
  resolveRowSplit,
  type NameOrder,
  type NameRow,
  type NameSplitPlan,
  type RowSplit,
} from '../../utils/csvNameSplit'

const translations = {
  en: {
    nameSplit: {
      title: 'Split names',
      orderLabel: 'Default order',
      lastFirst: 'Last name first (DUPONT Marie)',
      firstLast: 'First name first (Marie DUPONT)',
      hint: 'Click between two words to move the cut for that row. Rows you adjust keep their cut when the default order changes.',
      cutHere: 'Cut here',
      lastName: 'Last name',
      firstName: 'First name',
      singleWord: 'single word, used as last name',
      swap: 'Swap',
      reset: 'Default'
    }
  },
  fr: {
    nameSplit: {
      title: 'Découper les noms',
      orderLabel: 'Ordre par défaut',
      lastFirst: 'Nom d\'abord (DUPONT Marie)',
      firstLast: 'Prénom d\'abord (Marie DUPONT)',
      hint: 'Cliquez entre deux mots pour déplacer la coupure de cette ligne. Les lignes ajustées gardent leur coupure quand l\'ordre par défaut change.',
      cutHere: 'Couper ici',
      lastName: 'Nom',
      firstName: 'Prénom',
      singleWord: 'un seul mot, utilisé comme nom',
      swap: 'Inverser',
      reset: 'Par défaut'
    }
  }
}

const { t } = useTranslations(translations)

const props = defineProps<{
  rows: NameRow[]
  plan: NameSplitPlan
}>()

const emit = defineEmits<{
  'update:plan': [plan: NameSplitPlan]
}>()

const splits = computed(() =>
  props.rows.map(row => ({ row, split: resolveRowSplit(row.name, row.index, props.plan) }))
)

function sideClass(position: number, split: RowSplit): string {
  if (split.words.length < 2) return 'is-last'
  const left = position < split.cut
  return left === (split.order === 'last_first') ? 'is-last' : 'is-first'
}

function onOrderChange(event: Event) {
  emit('update:plan', { ...props.plan, order: (event.target as HTMLSelectElement).value as NameOrder })
}

function override(rowIndex: number, cut: number, order: NameOrder) {
  emit('update:plan', { ...props.plan, overrides: { ...props.plan.overrides, [rowIndex]: { cut, order } } })
}

function setCut(rowIndex: number, cut: number, split: RowSplit) {
  override(rowIndex, cut, split.order)
}

function swapSides(rowIndex: number, split: RowSplit) {
  override(rowIndex, split.cut, split.order === 'last_first' ? 'first_last' : 'last_first')
}

function resetRow(rowIndex: number) {
  const overrides = { ...props.plan.overrides }
  delete overrides[rowIndex]
  emit('update:plan', { ...props.plan, overrides })
}
</script>

<style scoped>
.ocf-name-split {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.ocf-name-split-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.ocf-name-split-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.ocf-name-split-order {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.ocf-name-split-order-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.ocf-name-split-hint {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.ocf-name-split-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.ocf-name-split-row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-md);
  border-left: 3px solid transparent;
}

.ocf-name-split-row.is-adjusted {
  border-left-color: var(--color-primary);
}

.ocf-name-split-words {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: var(--spacing-xs);
  min-width: 0;
}

.ocf-name-split-word {
  padding: 2px var(--spacing-xs);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.ocf-name-split-word.is-last {
  background: var(--color-primary-light);
  color: var(--color-text-primary);
  font-weight: 600;
}

.ocf-name-split-word.is-first {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.ocf-name-split-cut {
  width: 14px;
  height: 24px;
  margin: 0 1px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  flex: none;
}

.ocf-name-split-cut::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 2px;
  bottom: 2px;
  width: 2px;
  transform: translateX(-50%);
  background: var(--color-border-medium);
  border-radius: 1px;
}

.ocf-name-split-cut:hover::before {
  background: var(--color-text-secondary);
}

.ocf-name-split-cut.is-active::before {
  width: 3px;
  background: var(--color-primary);
}

.ocf-name-split-result {
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.ocf-name-split-result > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ocf-name-split-last {
  font-weight: 600;
}

.ocf-name-split-first.is-flag {
  font-style: italic;
  color: var(--color-warning);
}

.ocf-name-split-result-label {
  display: inline-block;
  min-width: 4.5em;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.ocf-name-split-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.ocf-name-split-action {
  padding: 2px var(--spacing-sm);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.ocf-name-split-action:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.ocf-name-split-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
