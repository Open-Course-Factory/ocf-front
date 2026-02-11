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
import { useRouter } from 'vue-router'
import { OrganizationsList, OrganizationModal } from '../Organizations'
import { useOrganizationsStore } from '../../stores/organizations'
import { usePermissionsStore } from '../../stores/permissions'
import type { Organization, CreateOrganizationRequest, UpdateOrganizationRequest } from '../../types'

const router = useRouter()
const organizationsStore = useOrganizationsStore()
const permissionsStore = usePermissionsStore()

const isModalOpen = ref(false)
const selectedOrganization = ref<Organization | null>(null)
const isSubmitting = ref(false)
const modalError = ref('')

// Use centralized admin-mode-aware filtering from the store
const filteredOrganizations = computed(() => organizationsStore.userOrganizations)

onMounted(async () => {
  await Promise.all([
    loadOrganizations(),
    permissionsStore.loadCurrentUser()
  ])
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
    modalError.value = err.response?.data?.error_message || err.message || 'An error occurred'
  } finally {
    isSubmitting.value = false
  }
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
