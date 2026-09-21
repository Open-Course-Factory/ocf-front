<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { defaultBranding, useBrandingStore } from '../../../stores/branding'
import { useTranslations } from '../../../composables/useTranslations'
import AdminBadge from '../../Common/AdminBadge.vue'

const store = useBrandingStore()
const draft = reactive({ ...store.branding })
const busy = ref(true)
const failedLoad = ref(false)
const error = ref('')
const success = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const { t } = useTranslations({
  fr: { branding: {
    title: 'Identité de la plateforme', description: 'Ces réglages sont communs à toute la classe. Seule l’administration peut les modifier. Le mode clair/sombre reste personnel.',
    name: 'Nom affiché', logo: 'Logo', limits: 'PNG ou JPEG, 256 Kio maximum, 2 048 pixels par côté et 2 millions de pixels au total.',
    primary: 'Couleur principale', secondary: 'Couleur secondaire', remove: 'Retirer le logo', preview: 'Aperçu',
    save: 'Enregistrer', saving: 'Enregistrement…', reset: 'Rétablir les valeurs OCF dans le formulaire', saved: 'Identité enregistrée. Elle sera chargée à la prochaine ouverture des autres navigateurs.',
    loadError: 'Impossible de charger l’identité. Rechargez la page avant de modifier les réglages.', saveError: 'Enregistrement impossible. Vérifiez le nom, les couleurs et les dimensions du logo.', imageError: 'Choisissez une image PNG ou JPEG de 256 Kio maximum.'
  } },
  en: { branding: {
    title: 'Platform identity', description: 'These settings apply to the entire class. Only administrators can edit them. Light/dark mode remains a personal preference.',
    name: 'Display name', logo: 'Logo', limits: 'PNG or JPEG, up to 256 KiB, 2,048 pixels per side and 2 million pixels in total.',
    primary: 'Primary color', secondary: 'Secondary color', remove: 'Remove logo', preview: 'Preview',
    save: 'Save', saving: 'Saving…', reset: 'Restore OCF defaults in the form', saved: 'Identity saved. Other browsers will load it the next time they open the application.',
    loadError: 'Unable to load the identity. Reload this page before editing settings.', saveError: 'Unable to save. Check the name, colors and logo dimensions.', imageError: 'Choose a PNG or JPEG image no larger than 256 KiB.'
  } }
})
onMounted(async () => {
  try { await store.load(); Object.assign(draft, store.branding) }
  catch { error.value = t('branding.loadError'); failedLoad.value = true }
  finally { busy.value = false }
})
function selectLogo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  success.value = false
  if (!file) return
  if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 256 * 1024) {
    error.value = t('branding.imageError'); input.value = ''; return
  }
  const reader = new FileReader()
  reader.onload = () => { draft.logo = String(reader.result); error.value = '' }
  reader.onerror = () => { error.value = t('branding.imageError') }
  reader.readAsDataURL(file)
}
function reset() { Object.assign(draft, defaultBranding); if (fileInput.value) fileInput.value.value = ''; success.value = false }
async function save() {
  busy.value = true; error.value = ''; success.value = false
  try { await store.save({ ...draft }); Object.assign(draft, store.branding); success.value = true }
  catch { error.value = t('branding.saveError') }
  finally { busy.value = false }
}
</script>

<template>
  <section class="branding-settings">
    <h2>{{ t('branding.title') }} <AdminBadge /></h2>
    <p>{{ t('branding.description') }}</p>
    <p v-if="error" role="alert" class="error-message">{{ error }}</p>
    <p v-if="success" role="status">{{ t('branding.saved') }}</p>
    <form @submit.prevent="save">
      <fieldset :disabled="busy || failedLoad">
        <div class="form-group">
          <label for="brand-name">{{ t('branding.name') }}</label>
          <input id="brand-name" v-model="draft.name" class="form-control" required maxlength="80" />
        </div>
        <div class="form-group">
          <label for="brand-logo">{{ t('branding.logo') }}</label>
          <input id="brand-logo" ref="fileInput" type="file" accept="image/png,image/jpeg" aria-describedby="logo-limits" @change="selectLogo" />
          <p id="logo-limits">{{ t('branding.limits') }}</p>
          <button v-if="draft.logo" type="button" class="btn btn-secondary" @click="draft.logo = ''; success = false">{{ t('branding.remove') }}</button>
        </div>
        <div class="color-fields">
          <label for="brand-primary">{{ t('branding.primary') }} <input id="brand-primary" v-model="draft.primary_color" type="color" /></label>
          <label for="brand-secondary">{{ t('branding.secondary') }} <input id="brand-secondary" v-model="draft.secondary_color" type="color" /></label>
        </div>
        <div class="brand-preview" :style="{ borderColor: draft.primary_color }" :aria-label="t('branding.preview')">
          <img v-if="draft.logo" :src="draft.logo" alt="" />
          <strong>{{ draft.name }}</strong>
          <span class="swatch" :style="{ backgroundColor: draft.primary_color }"></span>
          <span class="swatch" :style="{ backgroundColor: draft.secondary_color }"></span>
        </div>
        <div class="actions">
          <button type="submit" class="btn btn-primary">{{ busy ? t('branding.saving') : t('branding.save') }}</button>
          <button type="button" class="btn btn-secondary" @click="reset">{{ t('branding.reset') }}</button>
        </div>
      </fieldset>
    </form>
  </section>
</template>

<style scoped>
.branding-settings { max-width: 48rem; padding: var(--spacing-lg); color: var(--color-text-primary); }
fieldset { border: 0; padding: 0; min-width: 0; }
.color-fields, .actions, .brand-preview { display: flex; align-items: center; flex-wrap: wrap; gap: var(--spacing-md); margin-block: var(--spacing-lg); }
.color-fields label { display: flex; align-items: center; gap: var(--spacing-sm); }
.brand-preview { padding: var(--spacing-lg); border: 2px solid; border-radius: var(--border-radius-md); background: var(--color-bg-secondary); }
.brand-preview img { max-width: 8rem; max-height: 4rem; object-fit: contain; }
.swatch { width: 2rem; height: 2rem; border-radius: var(--border-radius-md); }
.error-message { color: var(--color-danger); }
.btn-primary { color: var(--color-on-primary, var(--color-white)); }
.btn-primary:hover { color: var(--color-on-primary-hover, var(--color-white)); }
.btn-secondary { color: var(--color-on-secondary, var(--color-white)); }
.btn-secondary:hover { color: var(--color-on-secondary-hover, var(--color-white)); }
</style>
