<template>
    <button class="btn btn-primary" @click="generateCourse" :disabled="isLoading">
      <i class="fas fa-gear"></i> 
      <br>
      {{ t(`courses.generate`) }}
      
    </button>
    <Modal :visible="showModal" :is-loading="isLoading" @close="closeModal">
      <div v-if="!isLoading">
        <h2>{{ modalTitle }}</h2>
        <p>{{ modalMessage }}</p>
      </div>
    </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCurrentUserStore } from '../../store/currentUser';
import axios from 'axios';
import Modal from '../Modals/BaseModal.vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  authorEmail: {
    type: String,
    required: true
  },
  format: {
    type: Number,
    required: true
  },
  courseId: {
    type: String,
    required: true
  },
  scheduleId: {
    type: String,
    required: true,
  },
  themeId: {
    type: String,
    required: true,
  }
});

const { t } = useI18n();
const currentUserStore = useCurrentUserStore();
const error = ref('');
const apiUrl = import.meta.env.VITE_API_URL;
const protocol = import.meta.env.VITE_PROTOCOL;

const isLoading = ref(false);
const showModal = ref(false);
const modalTitle = ref('');
const modalMessage = ref('');


const payload = computed(() => ({
  authorEmail: props.authorEmail,
  format: props.format,
  courseId: props.courseId,
  scheduleId: props.scheduleId,
  themeId: props.themeId
}));

async function generateCourse() {
  isLoading.value = true;
  error.value = '';
  modalTitle.value = '';
  modalMessage.value = '';

  try {
    showModal.value = true;
    isLoading.value = true;
    const response = await axios.post(`${protocol}://${apiUrl}/api/v1/courses/generate`, payload.value, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentUserStore.secretToken,
      },
    });    
    
    if (response.status === 201) {
      modalTitle.value = 'Succès';
      modalMessage.value = 'Cours généré avec succès !';
    } else {
      modalTitle.value = 'Erreur';
      modalMessage.value = 'Erreur lors de la génération du cours.';
      console.error(response.statusText)
    }
  } catch (err) {
    modalTitle.value = 'Erreur';
    modalMessage.value = 'Erreur lors de la génération du cours. Veuillez réessayer.';
    console.error(err)
  } finally {
    isLoading.value = false;
  }
}

function closeModal() {
  showModal.value = false;
  modalTitle.value = '';
  modalMessage.value = '';
}

</script>

<style scoped>
/* Ajoutez des styles si nécessaire */
</style>
