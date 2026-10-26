<template>
  <div class="form-group">
    <label :for="`${idPrefix}-password`">{{ t('passwordConfirm.password') }}</label>
    <input
      :id="`${idPrefix}-password`"
      v-model="password"
      type="password"
      autocomplete="new-password"
      class="form-control"
      required
      :minlength="MIN_ADMIN_PASSWORD_LENGTH"
    />
    <span class="form-text">{{ hint || t('passwordConfirm.minLength', { min: MIN_ADMIN_PASSWORD_LENGTH }) }}</span>
  </div>
  <div class="form-group">
    <label :for="`${idPrefix}-password-confirm`">{{ t('passwordConfirm.confirm') }}</label>
    <input
      :id="`${idPrefix}-password-confirm`"
      v-model="confirm"
      type="password"
      autocomplete="new-password"
      class="form-control"
      required
    />
    <!-- Always rendered so the mismatch message never pushes the form down. -->
    <span class="ocf-password-mismatch" aria-live="polite">
      {{ mismatch ? t('passwordConfirm.mismatch') : '' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { MIN_ADMIN_PASSWORD_LENGTH, passwordsMismatch } from '../../utils/passwordConfirmation'

defineProps<{
  /** Prefix of the two input ids (`<prefix>-password`, `<prefix>-password-confirm`). */
  idPrefix: string
  /** Replaces the default minimum-length hint under the password field. */
  hint?: string
}>()

const password = defineModel<string>('password', { required: true })
const confirm = defineModel<string>('confirm', { required: true })

const mismatch = computed(() => passwordsMismatch(password.value, confirm.value))

const { t } = useTranslations({
  en: {
    passwordConfirm: {
      password: 'Password',
      confirm: 'Confirm password',
      minLength: 'At least {min} characters.',
      mismatch: 'Passwords do not match'
    }
  },
  fr: {
    passwordConfirm: {
      password: 'Mot de passe',
      confirm: 'Confirmer le mot de passe',
      minLength: 'Au moins {min} caractères.',
      mismatch: 'Les mots de passe ne correspondent pas'
    }
  }
})
</script>

<style scoped>
.ocf-password-mismatch {
  display: block;
  min-height: 1.5em;
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-danger-text);
}
</style>
