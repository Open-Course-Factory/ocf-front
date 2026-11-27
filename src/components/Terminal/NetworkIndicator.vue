<!--
  Whether the session's machine reaches the internet: a globe (on) or a
  crossed sign (off), in a terminal's or a desktop's header.
-->
<template>
  <span
    class="network-indicator"
    :class="on ? 'network-on' : 'network-off'"
    :title="on ? t('networkIndicator.on') : t('networkIndicator.off')"
  >
    <i :class="on ? 'fas fa-globe' : 'fas fa-ban'"></i>
  </span>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'

defineProps<{ on: boolean }>()

const { t } = useTranslations({
  en: { networkIndicator: { on: 'Internet access: on', off: 'Internet access: off' } },
  fr: { networkIndicator: { on: 'Accès internet : activé', off: 'Accès internet : désactivé' } }
})
</script>

<style scoped>
.network-indicator {
  display: inline-flex;
  align-items: center;
  font-size: var(--font-size-sm);
  line-height: 1;
  cursor: default;
}

.network-indicator.network-on {
  color: var(--color-success);
}

.network-indicator.network-off {
  color: var(--color-text-muted);
}
</style>
