import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useStoreTranslations } from '../composables/useTranslations'
import { isDemoMode, logDemoAction } from '../services/demo'
import type { User, UserEffectiveFeatures } from '../types'

export const usePermissionsStore = defineStore('permissions', () => {
  const currentUser = ref<User | null>(null)
  const effectiveFeatures = ref<UserEffectiveFeatures | null>(null)
  const isLoading = ref(false)
  const error = ref('')

  // Translations
  const { t } = useStoreTranslations({
    en: {
      permissions: {
        loadError: 'Failed to load user permissions',
        notAuthorized: 'You are not authorized to perform this action',
      }
    },
    fr: {
      permissions: {
        loadError: 'Échec du chargement des permissions',
        notAuthorized: 'Vous n\'êtes pas autorisé à effectuer cette action',
      }
    }
  })

  // Load current user with memberships
  const loadCurrentUser = async () => {
    isLoading.value = true
    error.value = ''
    try {
      if (isDemoMode()) {
        logDemoAction('loadCurrentUser')
        currentUser.value = {
          id: 'demo-user-1',
          email: 'demo@example.com',
          username: 'demo',
          display_name: 'Demo User',
          roles: [{ id: 'role-1', name: 'member' }],
          is_active: true,
          organization_memberships: [
            {
              id: 'mem-1',
              organization_id: 'demo-org-1',
              user_id: 'demo-user-1',
              role: 'owner',
              joined_at: new Date().toISOString(),
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'mem-2',
              organization_id: 'demo-org-2',
              user_id: 'demo-user-1',
              role: 'member',
              joined_at: new Date().toISOString(),
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ],
          group_memberships: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        return currentUser.value
      }

      const response = await axios.get('/users/me', {
        params: { includes: 'organization_memberships,group_memberships' }
      })
      currentUser.value = response.data.data || response.data
      return currentUser.value
    } catch (err: any) {
      error.value = err.response?.data?.error_message || err.message || t('permissions.loadError')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Load effective features (aggregated from all organizations)
  const loadEffectiveFeatures = async () => {
    isLoading.value = true
    error.value = ''
    try {
      if (isDemoMode()) {
        logDemoAction('loadEffectiveFeatures')
        effectiveFeatures.value = {
          user_id: 'demo-user-1',
          effective_features: {
            id: 'effective-plan',
            name: 'Aggregated Features',
            priority: 30,
            stripe_product_id: '',
            stripe_price_id: '',
            price_amount: 0,
            currency: 'EUR',
            billing_interval: 'month',
            trial_days: 0,
            features: ['advanced_terminals', 'api_access', 'multiple_groups'],
            max_concurrent_users: 100,
            max_courses: 50,
            max_lab_sessions: 200,
            is_active: true,
            required_role: 'member',
            max_session_duration_minutes: 240,
            max_concurrent_terminals: 10,
            allowed_machine_sizes: ['XS', 'S', 'M', 'L'],
            network_access_enabled: true,
            data_persistence_enabled: true,
            data_persistence_gb: 50,
            allowed_templates: [],
            allowed_backends: [],
            default_backend: '',
            command_history_retention_days: 30,
            use_tiered_pricing: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          source_organizations: [
            {
              organization_id: 'demo-org-1',
              organization_name: 'Demo Organization',
              role: 'owner',
              contributing_features: ['advanced_terminals', 'api_access'],
            }
          ],
          has_personal_subscription: false,
        }
        return effectiveFeatures.value
      }

      const response = await axios.get('/users/me/features')
      effectiveFeatures.value = response.data.data || response.data
      return effectiveFeatures.value
    } catch (err: any) {
      error.value = err.response?.data?.error_message || err.message || t('permissions.loadError')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ==========================================
  // SYSTEM ROLE CHECKS
  // ==========================================

  const isSystemAdmin = computed((): boolean => {
    if (!currentUser.value) return false
    return currentUser.value.roles?.some(role => {
      const roleName = role.name as string
      return roleName === 'administrator' || roleName === 'admin'
    }) ?? false
  })

  const isMember = computed((): boolean => {
    if (!currentUser.value) return false
    return currentUser.value.roles?.some(role => role.name === 'member') ?? false
  })

  // ==========================================
  // ORGANIZATION ROLE CHECKS
  // ==========================================

  const isOrganizationOwner = (organizationId: string): boolean => {
    if (!currentUser.value) return false
    const membership = currentUser.value.organization_memberships?.find(
      m => m.organization_id === organizationId
    )
    return membership?.role === 'owner'
  }

  const isOrganizationManager = (organizationId: string): boolean => {
    if (!currentUser.value) return false
    const membership = currentUser.value.organization_memberships?.find(
      m => m.organization_id === organizationId
    )
    return membership?.role === 'manager'
  }

  const canManageOrganization = (organizationId: string): boolean => {
    if (!currentUser.value) return false
    const membership = currentUser.value.organization_memberships?.find(
      m => m.organization_id === organizationId
    )
    return membership?.role === 'owner' || membership?.role === 'manager'
  }

  const isOrganizationMember = (organizationId: string): boolean => {
    if (!currentUser.value) return false
    return currentUser.value.organization_memberships?.some(
      m => m.organization_id === organizationId && m.is_active
    ) ?? false
  }

  // ==========================================
  // GROUP ROLE CHECKS
  // ==========================================

  const isGroupOwner = (groupId: string): boolean => {
    if (!currentUser.value) return false
    const membership = currentUser.value.group_memberships?.find(
      m => m.group_id === groupId
    )
    return membership?.role === 'owner'
  }

  const isGroupAdmin = (groupId: string): boolean => {
    if (!currentUser.value) return false
    const membership = currentUser.value.group_memberships?.find(
      m => m.group_id === groupId
    )
    return membership?.role === 'admin'
  }

  const canManageGroup = (groupId: string): boolean => {
    if (!currentUser.value) return false
    const membership = currentUser.value.group_memberships?.find(
      m => m.group_id === groupId
    )
    return membership?.role === 'owner' || membership?.role === 'admin'
  }

  const isGroupMember = (groupId: string): boolean => {
    if (!currentUser.value) return false
    return currentUser.value.group_memberships?.some(
      m => m.group_id === groupId
    ) ?? false
  }

  // ==========================================
  // FEATURE CHECKS
  // ==========================================

  const hasFeature = (featureName: string): boolean => {
    if (!effectiveFeatures.value) return false
    return effectiveFeatures.value.effective_features.features?.includes(featureName) ?? false
  }

  const getMaxConcurrentTerminals = computed((): number => {
    return effectiveFeatures.value?.effective_features?.max_concurrent_terminals ?? 0
  })

  const getMaxCourses = computed((): number => {
    return effectiveFeatures.value?.effective_features?.max_courses ?? 0
  })

  const getMaxSessionDuration = computed((): number => {
    return effectiveFeatures.value?.effective_features?.max_session_duration_minutes ?? 60
  })

  const canCreateTerminal = computed((): boolean => {
    return getMaxConcurrentTerminals.value > 0
  })

  const canUseAPI = computed((): boolean => {
    return hasFeature('api_access')
  })

  const canExportCourses = computed((): boolean => {
    return (effectiveFeatures.value?.effective_features as any)?.can_export_courses ?? false
  })

  // ==========================================
  // COMBINED PERMISSION CHECKS
  // ==========================================

  const canManageOrganizationBilling = (organizationId: string): boolean => {
    return isSystemAdmin.value || canManageOrganization(organizationId)
  }

  const canManageOrganizationMembers = (organizationId: string): boolean => {
    return isSystemAdmin.value || canManageOrganization(organizationId)
  }

  const canViewOrganization = (organizationId: string): boolean => {
    return isSystemAdmin.value || isOrganizationMember(organizationId)
  }

  // ==========================================
  // OWNER-ONLY PERMISSION CHECKS
  // ==========================================

  const canDeleteOrganization = (organizationId: string): boolean => {
    return isSystemAdmin.value || isOrganizationOwner(organizationId)
  }

  const canTransferOwnership = (organizationId: string): boolean => {
    return isSystemAdmin.value || isOrganizationOwner(organizationId)
  }

  const canPromoteToOwner = (organizationId: string): boolean => {
    return isSystemAdmin.value || isOrganizationOwner(organizationId)
  }

  const canConvertOrganizationType = (organizationId: string): boolean => {
    return isSystemAdmin.value || isOrganizationOwner(organizationId)
  }

  return {
    // State
    currentUser,
    effectiveFeatures,
    isLoading,
    error,

    // Actions
    loadCurrentUser,
    loadEffectiveFeatures,

    // System role checks
    isSystemAdmin,
    isMember,

    // Organization role checks
    isOrganizationOwner,
    isOrganizationManager,
    canManageOrganization,
    isOrganizationMember,

    // Group role checks
    isGroupOwner,
    isGroupAdmin,
    canManageGroup,
    isGroupMember,

    // Feature checks
    hasFeature,
    getMaxConcurrentTerminals,
    getMaxCourses,
    getMaxSessionDuration,
    canCreateTerminal,
    canUseAPI,
    canExportCourses,

    // Combined permission checks
    canManageOrganizationBilling,
    canManageOrganizationMembers,
    canViewOrganization,

    // Owner-only permission checks
    canDeleteOrganization,
    canTransferOwnership,
    canPromoteToOwner,
    canConvertOrganizationType,

    // Translations
    t,
  }
})
