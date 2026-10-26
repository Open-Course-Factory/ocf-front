<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { brandingLogoUrl, defaultBranding, useBrandingStore } from '../../../stores/branding'
import { useTranslations } from '../../../composables/useTranslations'
import AdminBadge from '../../Common/AdminBadge.vue'

const store = useBrandingStore()
const draft = reactive({ name: '', primary_color: '', secondary_color: '' })
// undefined keeps the saved logo, '' removes it, a data URI replaces it.
const logoDraft = ref<string | undefined>(undefined)
const previewLogo = computed(() => logoDraft.value ?? brandingLogoUrl(store.branding))
const busy = ref(true)
const failedLoad = ref(false)
const error = ref('')
const success = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const { t } = useTranslations({
  fr: { branding: {
    title: 'Identité de la plateforme', description: 'Ces réglages s’appliquent à toute la plateforme. Seule l’administration peut les modifier. Le mode clair/sombre reste personnel.',
    name: 'Nom affiché', logo: 'Logo', limits: 'PNG ou JPEG, 256 Kio maximum, 2 048 pixels par côté et 2 millions de pixels au total.',
    colorsHint: 'Les couleurs doivent rester lisibles : un contraste d’au moins 3:1 avec le texte blanc des boutons et avec les fonds clair et sombre.',
    primary: 'Couleur principale', secondary: 'Couleur secondaire', remove: 'Retirer le logo', preview: 'Aperçu',
    save: 'Enregistrer', saving: 'Enregistrement…', reset: 'Rétablir les valeurs OCF dans le formulaire', saved: 'Identité enregistrée. Elle sera chargée à la prochaine ouverture des autres navigateurs.',
    loadError: 'Impossible de charger l’identité. Rechargez la page avant de modifier les réglages.', saveError: 'Enregistrement impossible. Vérifiez le nom, le contraste des couleurs et les dimensions du logo.', imageError: 'Choisissez une image PNG ou JPEG de 256 Kio maximum.'
  } },
  en: { branding: {
    title: 'Platform identity', description: 'These settings apply to the entire platform. Only administrators can edit them. Light/dark mode remains a personal preference.',
    name: 'Display name', logo: 'Logo', limits: 'PNG or JPEG, up to 256 KiB, 2,048 pixels per side and 2 million pixels in total.',
    colorsHint: 'Colors must stay readable: a contrast of at least 3:1 with the white button text and with both the light and dark backgrounds.',
    primary: 'Primary color', secondary: 'Secondary color', remove: 'Remove logo', preview: 'Preview',
    save: 'Save', saving: 'Saving…', reset: 'Restore OCF defaults in the form', saved: 'Identity saved. Other browsers will load it the next time they open the application.',
    loadError: 'Unable to load the identity. Reload this page before editing settings.', saveError: 'Unable to save. Check the name, the color contrast and the logo dimensions.', imageError: 'Choose a PNG or JPEG image no larger than 256 KiB.'
  } }
})
function resetDraftToSaved() {
  Object.assign(draft, { name: store.branding.name, primary_color: store.branding.primary_color, secondary_color: store.branding.secondary_color })
  logoDraft.value = undefined
}
onMounted(async () => {
  try { await store.load(); resetDraftToSaved() }
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
  reader.onload = () => { logoDraft.value = String(reader.result); error.value = '' }
  reader.onerror = () => { error.value = t('branding.imageError') }
  reader.readAsDataURL(file)
}
function removeLogo() { logoDraft.value = ''; success.value = false }
function reset() {
  Object.assign(draft, { name: defaultBranding.name, primary_color: defaultBranding.primary_color, secondary_color: defaultBranding.secondary_color })
  removeLogo()
  if (fileInput.value) fileInput.value.value = ''
}
async function save() {
  busy.value = true; error.value = ''; success.value = false
  try { await store.save({ ...draft, logo: logoDraft.value }); resetDraftToSaved(); success.value = true }
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
          <button v-if="previewLogo" type="button" class="btn btn-secondary" @click="removeLogo">{{ t('branding.remove') }}</button>
        </div>
        <p id="colors-hint">{{ t('branding.colorsHint') }}</p>
        <div class="color-fields">
          <label for="brand-primary">{{ t('branding.primary') }} <input id="brand-primary" v-model="draft.primary_color" type="color" aria-describedby="colors-hint" /></label>
          <label for="brand-secondary">{{ t('branding.secondary') }} <input id="brand-secondary" v-model="draft.secondary_color" type="color" aria-describedby="colors-hint" /></label>
        </div>
        <div class="brand-preview" :style="{ borderColor: draft.primary_color }" :aria-label="t('branding.preview')">
          <img v-if="previewLogo" :src="previewLogo" alt="" />
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
</style>
