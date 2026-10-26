<script setup lang="ts">
import { computed } from 'vue'
import { brandingLogoUrl, useBrandingStore } from '../../stores/branding'
const store = useBrandingStore()
const logoUrl = computed(() => brandingLogoUrl(store.branding))
</script>

<template>
  <!-- Branding is loaded before the app mounts (main.ts), and the logo's
       intrinsic size reserves its box, so nothing shifts once it paints. -->
  <span class="instance-brand">
    <img
      v-if="logoUrl"
      :src="logoUrl"
      :width="store.branding.logo_width"
      :height="store.branding.logo_height"
      alt=""
      class="instance-logo"
    />
    <i v-else class="fas fa-book" aria-hidden="true"></i>
    <span>{{ store.branding.name }}</span>
  </span>
</template>

<style scoped>
.instance-brand { display: inline-flex; align-items: center; gap: var(--spacing-sm, 0.5rem); }
.instance-logo { width: auto; max-width: 8rem; height: 2rem; object-fit: contain; }
</style>
