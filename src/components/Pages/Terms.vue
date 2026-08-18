<template>
  <div class="terms-page">
    <div class="terms-page-inner">
      <TermsOfService />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Public page for the terms.
 *
 * The document already existed, but only inside a modal on the registration
 * page — so a prospect comparing plans, or someone at checkout, had no way to
 * read what they were about to agree to. Pre-contractual information has to be
 * available before the purchase, not only at signup.
 *
 * A thin wrapper on purpose: the terms themselves stay in one component, shared
 * by this page and the registration modal, so the two can never drift.
 */
import TermsOfService from '../Legal/TermsOfService.vue'
</script>

<style scoped>
.terms-page {
  background: var(--color-background);
  min-height: 100vh;
  padding: 32px 16px 64px;
}

.terms-page-inner {
  max-width: 900px;
  margin: 0 auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 24px;
}
</style>
