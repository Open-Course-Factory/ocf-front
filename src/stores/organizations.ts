import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useBaseStore } from './baseStore'
import { useStoreTranslations } from '../composables/useTranslations'
import type { Organization, CreateOrganizationRequest, UpdateOrganizationRequest } from '../types'

export const useOrganizationsStore = defineStore('organizations', () => {
  const base = useBaseStore()

  // Translations
  const { t } = useStoreTranslations({
    en: {
      organizations: {
        name: 'Organizations',
        singular: 'Organization',
        createSuccess: 'Organization created successfully',
        updateSuccess: 'Organization updated successfully',
        deleteSuccess: 'Organization deleted successfully',
        loadError: 'Failed to load organizations',
        createError: 'Failed to create organization',
        updateError: 'Failed to update organization',
        deleteError: 'Failed to delete organization',
        notFound: 'Organization not found',
        nameRequired: 'Organization name is required',
        displayNameRequired: 'Display name is required',
      }
    },
    fr: {
      organizations: {
        name: 'Organisations',
        singular: 'Organisation',
        createSuccess: 'Organisation créée avec succès',
        updateSuccess: 'Organisation mise à jour avec succès',
        deleteSuccess: 'Organisation supprimée avec succès',
        loadError: 'Échec du chargement des organisations',
        createError: 'Échec de la création de l\'organisation',
        updateError: 'Échec de la mise à jour de l\'organisation',
        deleteError: 'Échec de la suppression de l\'organisation',
        notFound: 'Organisation introuvable',
        nameRequired: 'Le nom de l\'organisation est requis',
        displayNameRequired: 'Le nom d\'affichage est requis',
      }
    }
  })

  const apiEndpoint = '/organizations'

  // Computed properties
  const organizations = computed(() => base.getEntities() as Organization[])
  const personalOrganization = computed(() =>
    organizations.value.find(org => org.is_personal)
  )
  const businessOrganizations = computed(() =>
    organizations.value.filter(org => !org.is_personal)
  )

  // Demo data provider
  const getDemoOrganizations = (): Organization[] => [
    {
      id: 'demo-org-1',
      name: 'personal-demo',
      display_name: 'Personal Organization',
      description: 'Auto-created personal organization',
      owner_user_id: 'demo-user-1',
      is_personal: true,
      max_groups: 5,
      max_members: 10,
      is_active: true,
      group_count: 2,
      member_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-org-2',
      name: 'acme-corp',
      display_name: 'ACME Corporation',
      description: 'Training organization for ACME employees',
      owner_user_id: 'demo-user-1',
      is_personal: false,
      max_groups: 20,
      max_members: 100,
      is_active: true,
      group_count: 5,
      member_count: 25,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]

  // Load all organizations for current user
  const loadOrganizations = async (_includes?: string) => {
    return await base.loadEntities(apiEndpoint, getDemoOrganizations)
  }

  // Get single organization by ID
  const loadOrganization = async (id: string, _includes?: string) => {
    return await base.getOne(apiEndpoint, id, getDemoOrganizations)
  }

  // Create organization
  const createOrganization = async (data: CreateOrganizationRequest) => {
    if (!data.name) throw new Error(t('organizations.nameRequired'))
    if (!data.display_name) throw new Error(t('organizations.displayNameRequired'))

    return await base.createEntity(apiEndpoint, data)
  }

  // Update organization
  const updateOrganization = async (id: string, data: UpdateOrganizationRequest) => {
    return await base.updateEntity(apiEndpoint, id, data)
  }

  // Delete organization
  const deleteOrganization = async (id: string) => {
    return await base.deleteEntity(apiEndpoint, id)
  }

  // Get organization by ID (from store)
  const getOrganizationById = (id: string): Organization | undefined => {
    return organizations.value.find(org => org.id === id)
  }

  // Check if user owns organization
  const isOwner = (organizationId: string, userId: string): boolean => {
    const org = getOrganizationById(organizationId)
    return org?.owner_user_id === userId
  }

  return {
    // State
    ...base,
    organizations,
    personalOrganization,
    businessOrganizations,

    // Actions
    loadOrganizations,
    loadOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationById,
    isOwner,

    // Translations
    t,
  }
})
