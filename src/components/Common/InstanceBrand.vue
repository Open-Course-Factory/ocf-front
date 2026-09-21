<script setup lang="ts">
import { useBrandingStore } from '../../stores/branding'
const store = useBrandingStore()
</script>

<template>
  <span class="instance-brand">
    <img v-if="store.branding.logo" :src="store.branding.logo" alt="" class="instance-logo" />
    <i v-else class="fas fa-book" aria-hidden="true"></i>
    <span>{{ store.branding.name }}</span>
  </span>
</template>

<style scoped>
.instance-brand { display: inline-flex; align-items: center; gap: var(--spacing-sm, 0.5rem); }
.instance-logo { width: auto; max-width: 8rem; height: 2rem; object-fit: contain; }
</style>
