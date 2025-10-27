<template>
  <BaseModal
    :visible="isOpen"
    :title="t('tosModal.title')"
    size="large"
    :show-close="true"
    :close-on-overlay-click="true"
    @close="closeModal"
  >
    <template #default>
      <TermsOfService />
    </template>

    <template #footer>
      <button class="btn btn-secondary" @click="closeModal" type="button">
        {{ t('tosModal.close') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations';
import BaseModal from './BaseModal.vue';
import TermsOfService from '../Legal/TermsOfService.vue';

interface Props {
  isOpen: boolean;
}

interface Emits {
  (e: 'close'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useTranslations({
  en: {
    tosModal: {
      title: 'Terms of Service',
      close: 'Close'
    }
  },
  fr: {
    tosModal: {
      title: 'Conditions Générales d\'Utilisation',
      close: 'Fermer'
    }
  }
});

const closeModal = () => {
  emit('close');
};
</script>

<style scoped>
/* All modal styling is now handled by BaseModal */
.btn {
  padding: var(--btn-padding-md);
  border-radius: var(--border-radius-md);
  border: none;
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: background-color var(--transition-fast);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-white);
}

.btn-secondary:hover {
  background-color: var(--color-secondary-hover);
}
</style>
