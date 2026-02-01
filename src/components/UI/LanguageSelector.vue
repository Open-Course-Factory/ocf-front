<template>
  <div class="language-selector">
    <select :value="currentLocale" @change="handleLocaleChange" class="language-select">
      <option v-for="localeCode in supportedLocales" :key="`locale-${localeCode}`" :value="localeCode">
        {{ getLocaleInfo(localeCode).flag }} {{ getLocaleInfo(localeCode).name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { useLocale } from '../../composables/useLocale'

const { currentLocale, supportedLocales, setLocale, getLocaleInfo } = useLocale()

function handleLocaleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  setLocale(target.value)
}
</script>

<style scoped>
.language-selector {
  display: inline-block;
}

.language-select {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid var(--color-border-medium);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
  min-width: 140px;
}

.language-select:hover {
  border-color: var(--color-border-dark);
}

.language-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus-primary);
}

.language-select option {
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
}
</style>
