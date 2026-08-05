<template>
  <div class="organizations-page">
    <OrganizationsList
      :organizations="filteredOrganizations"
      :is-loading="organizationsStore.isLoading"
      :error="organizationsStore.error"
      :can-manage-organization="permissionsStore.canManageOrganization"
      @create="openCreateModal"
      @bulkImport="navigateToBulkImport"
      @manage="navigateToOrganization"
      @view="navigateToOrganization"
      @reload="loadOrganizations"
    />

    <OrganizationModal
      :is-open="isModalOpen"
      :organization="selectedOrganization"
      :is-submitting="isSubmitting"
      :error="modalError"
      @close="closeModal"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { OrganizationsList, OrganizationModal } from '../Organizations'
import { useOrganizationsStore } from '../../stores/organizations'
import { usePermissionsStore } from '../../stores/permissions'
import { useCurrentUserStore } from '../../stores/currentUser'
import { useClassroomEntitlement } from '../../composables/useClassroomEntitlement'
import { useTranslations } from '../../composables/useTranslations'
import type { Organization, CreateOrganizationRequest, UpdateOrganizationRequest } from '../../types'

const route = useRoute()
const router = useRouter()
const organizationsStore = useOrganizationsStore()
const permissionsStore = usePermissionsStore()
const currentUserStore = useCurrentUserStore()

const isModalOpen = ref(false)
const selectedOrganization = ref<Organization | null>(null)
const isSubmitting = ref(false)
const modalError = ref('')

// Same org-less verdict the create endpoint applies (core #476). ClassroomPlanCta
// reads it too, so the panel above the list and the form below it cannot disagree
// about whether this user may have an organization at all.
const { planAllowsClassrooms } = useClassroomEntitlement()

const { t } = useTranslations({
  en: {
    organizationsPage: {
      classroomPlanRequired: 'Your plan does not cover teaching, so this organization was refused. The Formateur plan adds organizations, classes and learner seats — you will find it under Available Plans.',
      submitFailed: 'The organization could not be saved. Please try again.',
    },
  },
  fr: {
    organizationsPage: {
      classroomPlanRequired: 'Votre forfait ne couvre pas l’enseignement : la création a été refusée. Le plan Formateur ajoute les organisations, les classes et les sièges apprenants — vous le trouverez dans Plans Disponibles.',
      submitFailed: 'L’organisation n’a pas pu être enregistrée. Veuillez réessayer.',
    },
  },
})

// Use centralized admin-mode-aware filtering from the store
const filteredOrganizations = computed(() => organizationsStore.userOrganizations)

onMounted(async () => {
  // Each failure is contained: the creation decision below waits for these, and
  // a request that fails for its own reasons must not also cost the user the
  // form they asked for.
  await Promise.all([
    loadOrganizations(),
    permissionsStore.loadCurrentUser().catch(() => null),
    // Awaited rather than left to the entitlement composable's own mount, so the
    // decision below is made on a verdict rather than on its absence.
    currentUserStore.ensurePermissionsLoaded().catch(() => null)
  ])

  // `?create=1` opens the form straight away, so a call to action elsewhere can
  // land on the thing it promised rather than on a page with a button on it.
  // The console's personal-organization state is the one that needs this: it is
  // the only route to creating a team organization from a personal context,
  // since the navigation hides the organizations category there.
  //
  // Not when the plan cannot carry an organization, though: the endpoint refuses
  // it (core #476), and a form that can only fail is a worse answer than the
  // panel above the list, which explains what the plan is missing and links to
  // it. An unresolved verdict still opens the form — see planAllowsClassrooms.
  if (route.query.create && planAllowsClassrooms.value !== false) {
    openCreateModal()
  }
})

const loadOrganizations = async () => {
  try {
    await organizationsStore.loadOrganizations('members,groups')
  } catch (err) {
    console.error('Failed to load organizations:', err)
  }
}

const openCreateModal = () => {
  selectedOrganization.value = null
  modalError.value = ''
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedOrganization.value = null
  modalError.value = ''
}

const handleSubmit = async (data: CreateOrganizationRequest | UpdateOrganizationRequest) => {
  isSubmitting.value = true
  modalError.value = ''

  try {
    if (selectedOrganization.value) {
      // Edit mode
      await organizationsStore.updateOrganization(
        selectedOrganization.value.id,
        data as UpdateOrganizationRequest
      )
    } else {
      // Create mode
      await organizationsStore.createOrganization(data as CreateOrganizationRequest)
    }

    closeModal()
    await loadOrganizations()
  } catch (err: any) {
    modalError.value = await describeSubmitFailure(err)
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Why the save failed, in the user's language.
 *
 * A creation refused for want of a teaching plan (core #476) has to read as the
 * plan gate it is, not as a raw backend sentence in English. Organizations go
 * through the generic entity route, so the refusal arrives in the entity-error
 * envelope with a machine-readable code beside the message; its mere presence
 * identifies this refusal, whichever code it carries.
 *
 * The permissions payload is re-read on the way, because the case this handles
 * is the plan changing server-side after the page decided to offer the form —
 * that also flips the panel above the list to its locked state, so the page
 * stops offering what it just refused.
 */
async function describeSubmitFailure(err: any): Promise<string> {
  const failure = err.response?.data?.error

  if (!selectedOrganization.value && failure?.details?.classroom_denied_reason) {
    await currentUserStore.loadPermissions().catch(() => null)
    return t('organizationsPage.classroomPlanRequired')
  }

  // Two envelopes reach this page: `error.message` from the entity routes,
  // `error_message` from the hand-written organization controllers.
  return failure?.message
    || err.response?.data?.error_message
    || err.message
    || t('organizationsPage.submitFailed')
}

const navigateToOrganization = (organizationId: string) => {
  router.push({ name: 'OrganizationDetail', params: { id: organizationId } })
}

const navigateToBulkImport = (organizationId: string) => {
  router.push({ name: 'BulkImport', params: { id: organizationId } })
}
</script>

<style scoped>
.organizations-page {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}
</style>
