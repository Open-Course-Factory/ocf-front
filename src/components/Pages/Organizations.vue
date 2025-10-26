<template>
  <div class="organizations-page">
    <OrganizationsList
      :organizations="filteredOrganizations"
      :is-loading="organizationsStore.isLoading"
      :error="organizationsStore.error"
      :can-manage-organization="permissionsStore.canManageOrganization"
      @create="openCreateModal"
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { OrganizationsList, OrganizationModal } from '../Organizations'
import { useOrganizationsStore } from '../../stores/organizations'
import { usePermissionsStore } from '../../stores/permissions'
import { useAdminViewMode } from '../../composables/useAdminViewMode'
import type { Organization, CreateOrganizationRequest, UpdateOrganizationRequest } from '../../types'

const router = useRouter()
const organizationsStore = useOrganizationsStore()
const permissionsStore = usePermissionsStore()
const { isAdmin, shouldFilterAsStandardUser } = useAdminViewMode()

const isModalOpen = ref(false)
const selectedOrganization = ref<Organization | null>(null)
const isSubmitting = ref(false)
const modalError = ref('')

// Filter organizations based on view mode
const filteredOrganizations = computed(() => {
  // If not admin OR admin viewing as standard user
  if (!isAdmin.value || shouldFilterAsStandardUser.value) {
    // Show only organizations where the user is a member
    const currentUserId = permissionsStore.currentUser?.id
    if (!currentUserId) return []

    return organizationsStore.organizations.filter(org => {
      // Show if user is owner
      if (org.owner_user_id === currentUserId) return true

      // Show if user is a member
      const userMemberships = permissionsStore.currentUser?.organization_memberships || []
      return userMemberships.some(membership =>
        membership.organization_id === org.id && membership.is_active
      )
    })
  }

  // Admin in full admin mode: show all organizations
  return organizationsStore.organizations
})

onMounted(async () => {
  await Promise.all([
    loadOrganizations(),
    permissionsStore.loadCurrentUser()
  ])
})

// Reload organizations when view mode changes
watch(shouldFilterAsStandardUser, async () => {
  // No need to reload from backend, just recompute the filtered list
  // The computed property will automatically update
})

const loadOrganizations = async () => {
  try {
    await organizationsStore.loadOrganizations('members,groups')
    console.log('Loaded organizations:', organizationsStore.organizations)
    console.log('Total count:', organizationsStore.organizations.length)
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
    modalError.value = err.response?.data?.error_message || err.message || 'An error occurred'
  } finally {
    isSubmitting.value = false
  }
}

const navigateToOrganization = (organizationId: string) => {
  router.push({ name: 'OrganizationDetail', params: { id: organizationId } })
}
</script>

<style scoped>
.organizations-page {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}
</style>
