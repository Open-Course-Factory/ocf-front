<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSshKeysStore } from '../../store/sshKeys';

const props = defineProps<{
  visible: boolean;
}>();
const emit = defineEmits<{
  (e: 'add-key', keyName: string, sshKey: string): void;
  (e: 'close'): void;
}>();

const keyName = ref('');
const sshKey = ref('');
const errors = ref<{ keyName: string | null, sshKey: string | null }>({ keyName: null, sshKey: null });

const sshKeysStore = useSshKeysStore();

function validateFields() {
  errors.value.keyName = keyName.value.trim() === '' ? 'Le nom de la clé SSH est requis.' : null;
  errors.value.sshKey = sshKey.value.trim() === '' ? 'La clé SSH est requise.' : null;
  
  if (!errors.value.keyName && sshKeysStore.sshKeys.some(key => key.name === keyName.value.trim())) {
    errors.value.keyName = 'Ce nom de clé SSH est déjà utilisé.';
  }
  if (!errors.value.sshKey && sshKeysStore.sshKeys.some(key => key.key === sshKey.value.trim())) {
    errors.value.sshKey = 'Cette clé SSH est déjà utilisée.';
  }
  
  return !errors.value.keyName && !errors.value.sshKey;
}

function handleAddKey() {
  if (validateFields()) {
    emit('add-key', keyName.value, sshKey.value);
    keyName.value = '';
    sshKey.value = '';
    errors.value = { keyName: null, sshKey: null };
  }
}

function closeModal() {
  emit('close');
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    keyName.value = '';
    sshKey.value = '';
    errors.value = { keyName: null, sshKey: null };
  }
});
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-body">
      <button class="close-button" @click="closeModal">&times;</button>
      <div class="modal-content">
        <h2>Ajouter une nouvelle clé SSH</h2>
        <div class="form-group">
          <label for="keyName">Nom de la clé SSH :</label>
          <input 
            id="keyName" 
            v-model="keyName" 
            :class="['form-control', { 'is-invalid': errors.keyName }]"
          />
          <div v-if="errors.keyName" class="invalid-feedback">
            {{ errors.keyName }}
          </div>
        </div>
        <div class="form-group">
          <label for="sshKey">Clé SSH :</label>
          <textarea 
            id="sshKey" 
            v-model="sshKey" 
            :class="['form-control', { 'is-invalid': errors.sshKey }]"
          />
          <div v-if="errors.sshKey" class="invalid-feedback">
            {{ errors.sshKey }}
          </div>
        </div>
        <button class="btn btn-primary" @click="handleAddKey">Ajouter</button>
      </div>
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
  height: auto;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  padding-left: 10px;
  padding-right: 10px;
  z-index: 2;
}

.modal-content {
  display: flex;
  flex-direction: column;
}

.modal-content button {
  width: 120px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
  height: auto;
}

textarea {
  height: 250px;
}

</style>