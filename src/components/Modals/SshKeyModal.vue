<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
}>();
const emit = defineEmits<{
  (e: 'add-key', keyName: string, sshKey: string): void;
  (e: 'close'): void;
}>();

const keyName = ref('');
const sshKey = ref('');

function handleAddKey() {
  emit('add-key', keyName.value, sshKey.value);
  keyName.value = '';
  sshKey.value = '';
}

function closeModal() {
  emit('close');
}

// Reset the fields when the modal is shown
watch(() => props.visible, (newVal) => {
  if (newVal) {
    keyName.value = '';
    sshKey.value = '';
  }
});
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-body">
      <button class="close-button" @click="closeModal">&times;</button>
      <h2>Ajouter une nouvelle clé SSH</h2>
      <label for="keyName">Nom de la clé SSH :</label>
      <input id="keyName" v-model="keyName" placeholder="Nom de la clé SSH" />
      <label for="sshKey">Clé SSH :</label>
      <input id="sshKey" v-model="sshKey" placeholder="Clé SSH" />
      <button @click="handleAddKey">Ajouter</button>
    </div>
  </div>
</template>
  

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-body {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  width: 90%;
  max-width: 800px;
  height: 90%;
  max-height: 500px;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
}
</style>
