<template>
  <BaseModal
    :visible="visible && !isCapturing"
    :title="t('feedbackModal.title')"
    titleIcon="fas fa-comment-dots"
    size="medium"
    :successMessage="successMessage"
    :errorMessage="errorMessage"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="feedback-form">
      <!-- Type selector -->
      <div class="form-group">
        <label class="form-label">{{ t('feedbackModal.typeLabel') }}</label>
        <div class="type-selector">
          <button
            v-for="option in typeOptions"
            :key="option.value"
            type="button"
            class="type-card"
            :class="{ selected: feedbackType === option.value }"
            @click="feedbackType = option.value"
          >
            <i :class="option.icon"></i>
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Message textarea -->
      <div class="form-group">
        <label class="form-label" for="feedback-message">{{ t('feedbackModal.messageLabel') }}</label>
        <textarea
          id="feedback-message"
          v-model="message"
          class="form-textarea"
          :placeholder="t('feedbackModal.messagePlaceholder')"
          rows="5"
          required
          minlength="10"
        ></textarea>
        <div class="char-count" :class="{ 'char-count-warning': message.length > 0 && message.length < 10 }">
          {{ message.length }} {{ t('feedbackModal.characters') }}
          <span v-if="message.length > 0 && message.length < 10">
            ({{ t('feedbackModal.minChars') }})
          </span>
        </div>
      </div>

      <!-- Screenshot -->
      <div class="form-group">
        <label class="form-label">{{ t('feedbackModal.screenshotLabel') }}</label>
        <div v-if="!screenshotBase64" class="screenshot-actions">
          <button
            type="button"
            class="btn btn-outline"
            @click="captureScreenshot"
            :disabled="isCapturing"
          >
            <i class="fas fa-camera"></i>
            {{ t('feedbackModal.captureScreenshot') }}
          </button>
          <p v-if="screenshotError" class="screenshot-error">
            <i class="fas fa-exclamation-triangle"></i>
            {{ screenshotError }}
          </p>
        </div>
        <div v-else class="screenshot-preview">
          <img :src="'data:image/png;base64,' + screenshotBase64" alt="Screenshot preview" />
          <button
            type="button"
            class="screenshot-remove"
            @click="removeScreenshot"
            :title="t('feedbackModal.removeScreenshot')"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </form>

    <template #footer>
      <button class="btn btn-secondary" @click="handleClose" :disabled="isSending">
        {{ t('feedbackModal.cancel') }}
      </button>
      <button
        class="btn btn-primary"
        @click="handleSubmit"
        :disabled="!isValid || isSending"
      >
        <i v-if="isSending" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-paper-plane"></i>
        {{ isSending ? t('feedbackModal.sending') : t('feedbackModal.send') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import axios from 'axios'
import html2canvas from 'html2canvas'
import { useTranslations } from '../../composables/useTranslations'
import BaseModal from '../Modals/BaseModal.vue'

interface Props {
  visible: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const { t } = useTranslations({
  en: {
    feedbackModal: {
      title: 'Send Feedback',
      typeLabel: 'What type of feedback?',
      typeBug: 'Bug',
      typeSuggestion: 'Suggestion',
      typeQuestion: 'Question',
      messageLabel: 'Your message',
      messagePlaceholder: 'Describe your feedback in detail...',
      characters: 'characters',
      minChars: 'minimum 10 characters',
      screenshotLabel: 'Screenshot (optional)',
      captureScreenshot: 'Capture screenshot',
      removeScreenshot: 'Remove screenshot',
      cancel: 'Cancel',
      send: 'Send',
      sending: 'Sending...',
      successMessage: 'Thank you! Your feedback has been sent successfully.',
      errorMessage: 'Failed to send feedback. Please try again.',
      screenshotTooLarge: 'Screenshot is too large. Try with a smaller window.',
    }
  },
  fr: {
    feedbackModal: {
      title: 'Envoyer un retour',
      typeLabel: 'Quel type de retour ?',
      typeBug: 'Bug',
      typeSuggestion: 'Suggestion',
      typeQuestion: 'Question',
      messageLabel: 'Votre message',
      messagePlaceholder: 'Décrivez votre retour en détail...',
      characters: 'caractères',
      minChars: 'minimum 10 caractères',
      screenshotLabel: 'Capture d\'écran (optionnel)',
      captureScreenshot: 'Capturer l\'écran',
      removeScreenshot: 'Supprimer la capture',
      cancel: 'Annuler',
      send: 'Envoyer',
      sending: 'Envoi...',
      successMessage: 'Merci ! Votre retour a été envoyé avec succès.',
      errorMessage: 'Échec de l\'envoi. Veuillez réessayer.',
      screenshotTooLarge: 'La capture d\'écran est trop volumineuse. Essayez avec une fenêtre plus petite.',
    }
  }
})

const feedbackType = ref<'bug' | 'suggestion' | 'question'>('bug')
const message = ref('')
const screenshotBase64 = ref('')
const screenshotError = ref('')
const isSending = ref(false)
const isCapturing = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const typeOptions = computed(() => [
  { value: 'bug' as const, label: t('feedbackModal.typeBug'), icon: 'fas fa-bug' },
  { value: 'suggestion' as const, label: t('feedbackModal.typeSuggestion'), icon: 'fas fa-lightbulb' },
  { value: 'question' as const, label: t('feedbackModal.typeQuestion'), icon: 'fas fa-question-circle' }
])

const isValid = computed(() => message.value.length >= 10)

function resetForm() {
  feedbackType.value = 'bug'
  message.value = ''
  screenshotBase64.value = ''
  screenshotError.value = ''
  successMessage.value = ''
  errorMessage.value = ''
}

function handleClose() {
  if (!isSending.value) {
    resetForm()
    emit('close')
  }
}

async function captureScreenshot() {
  isCapturing.value = true
  screenshotError.value = ''

  // Wait for Vue DOM update cycle, then one animation frame for browser repaint
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(resolve))

  try {
    const canvas = await html2canvas(document.body)
    let dataUrl = canvas.toDataURL('image/png')
    let base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')

    // If too large, try JPEG with lower quality
    const maxSize = 4 * 1024 * 1024
    if (base64.length > maxSize) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.6)
      base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    }

    if (base64.length > maxSize) {
      screenshotError.value = t('feedbackModal.screenshotTooLarge')
      return
    }

    screenshotBase64.value = base64
  } catch (err) {
    console.error('Screenshot capture failed:', err)
  } finally {
    isCapturing.value = false
  }
}

function removeScreenshot() {
  screenshotBase64.value = ''
}

async function handleSubmit() {
  if (!isValid.value || isSending.value) return

  isSending.value = true
  errorMessage.value = ''

  try {
    const payload: Record<string, string> = {
      type: feedbackType.value,
      message: message.value,
      page_url: window.location.href,
      user_agent: navigator.userAgent
    }

    if (screenshotBase64.value) {
      payload.screenshot = screenshotBase64.value
    }

    await axios.post('feedback/send', payload)

    successMessage.value = t('feedbackModal.successMessage')

    setTimeout(() => {
      resetForm()
      emit('close')
    }, 2000)
  } catch (err: any) {
    errorMessage.value = err.response?.data?.error_message
      || err.response?.data?.message
      || t('feedbackModal.errorMessage')
  } finally {
    isSending.value = false
  }
}
</script>

<style scoped>
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.type-selector {
  display: flex;
  gap: var(--spacing-sm);
}

.type-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  transition: all 0.2s ease;
}

.type-card:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: var(--color-bg-primary);
}

.type-card.selected {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
  color: var(--color-white);
}

.type-card i {
  font-size: var(--font-size-xl);
}

.form-textarea {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: var(--font-size-base);
  resize: vertical;
  min-height: 100px;
  box-sizing: border-box;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb, 99, 102, 241), 0.2);
}

.char-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: right;
}

.char-count-warning {
  color: var(--color-warning);
}

.screenshot-actions .btn-outline {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: transparent;
  border: 1px dashed var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.2s ease;
}

.screenshot-actions .btn-outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.screenshot-preview {
  position: relative;
  display: inline-block;
  max-width: 300px;
}

.screenshot-preview img {
  width: 100%;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
}

.screenshot-remove {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-danger);
  color: var(--color-white);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: transform 0.2s ease;
}

.screenshot-remove:hover {
  transform: scale(1.1);
}

.screenshot-error {
  margin: var(--spacing-xs) 0 0 0;
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

@media (max-width: 768px) {
  .type-selector {
    flex-direction: column;
  }
}
</style>
