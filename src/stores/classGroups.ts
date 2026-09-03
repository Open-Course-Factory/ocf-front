/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 *
 * See the LICENSE file for more information.
 */

import { defineStore } from "pinia"
import axios from "axios"
import { ElNotification } from "element-plus"
import { useBaseStore } from "./baseStore"
import { useOrganizationsStore } from "./organizations"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'
import { CLASS_PAGE_NAMES } from '../router/classPages'
import { useTeacherGroupsStore } from './teacherGroups'

/**
 * Generate URL-friendly slug from display name
 * Converts: "My Class 2024" → "my-class-2024"
 */
/**
 * Organizations that may actually hold a class, for the creation form's picker.
 *
 * The picker used to load every organization the API returned, so it offered
 * personal workspaces — which the product describes as "1 member only,
 * collaboration not available" — and organizations where the caller is a plain
 * member, while its own placeholder told them they had to be a manager (#299).
 *
 * The backend refuses both now (ocf-core#452), so an unfiltered list is a list of
 * choices that end in a 403. Two filters, matching the two gates there:
 *
 *   - team organizations only, because a personal one can never hold a class;
 *   - where the caller ranks at least teacher, because that is the threshold for
 *     running classes (ocf-core#460).
 *
 * Deliberately not filtered on the plan: entitlement depends on the organization
 * chosen, so hiding on that basis would need a resolution per row. The backend
 * remains the authority; this only removes choices that are certainly wrong.
 */
export async function loadOrganizationsThatCanHoldClasses(): Promise<any[]> {
    try {
        const response = await axios.get('/organizations')
        const organizations = response.data?.data || response.data || []

        return organizations.filter((org: any) => {
            const isPersonal = org.organization_type === 'personal' || org.is_personal === true
            if (isPersonal) return false

            // The API omits the caller's role on some listing shapes. Absent role
            // means "cannot tell", and dropping the organization then would hide
            // legitimate choices — so keep it and let the backend decide.
            const role = org.current_user_role ?? org.user_role ?? org.role
            if (!role) return true

            return role === 'owner' || role === 'manager' || role === 'teacher'
        })
    } catch (error) {
        console.error('Failed to load organizations:', error)
        return []
    }
}

/**
 * Subgroup names as typed in the creation form's textarea, one per line.
 * Blank and whitespace-only lines are dropped: a trailing newline must not
 * turn into an unnamed group.
 */
function parseSubgroupNames(rawInput: unknown): string[] {
    if (typeof rawInput !== 'string') return []

    return rawInput
        .split('\n')
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
}

function generateSlug(displayName: string): string {
    return displayName
        .toLowerCase()
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
}

export const useClassGroupsStore = defineStore('classGroups', () => {
    const base = useBaseStore()

    const { t } = useStoreTranslations({
        en: {
            classGroups: {
                id: "ID",
                pageTitle: "Groups",
                name: "URL slug (auto-generated)",
                display_name: "Display name",
                description: "Description",
                owner_user_id: "Owner",
                organization_id: "Organization",
                subscription_plan_id: "Subscription plan",
                parent_group_id: "Parent group",
                max_members: "Maximum members",
                member_count: "Current members",
                expires_at: "Expiration date",
                archived_at: "Archived on",
                is_active: "Active",
                is_full: "Full",
                is_expired: "Expired",
                metadata: "Metadata",
                created_at: "Created",
                updated_at: "Updated",
                modify: "Modify group",
                add: "Create a group",
                delete: "Delete group",
                manageMembers: "Manage members",
                noGroups: "No groups found",
                loading: "Loading groups...",
                saving: "Saving...",
                createSuccess: "Group created successfully",
                updateSuccess: "Group updated successfully",
                deleteSuccess: "Group deleted successfully",
                loadError: "Failed to load groups",
                createError: "Failed to create group",
                updateError: "Failed to update group",
                deleteError: "Failed to delete group",
                groupInfo: "Manage your classes and teams",
                nameHelp: "Auto-generated from display name (lowercase, hyphens only)",
                displayNameHelp: "Human-readable name for the group",
                organizationHelp: "Select the organization for this group (you must be manager or owner)",
                parentGroupHelp: "Optional parent group for hierarchical organization",
                maxMembersHelp: "Maximum number of members allowed in this group",
                expiresAtHelp: "Optional expiration date for the group",
                statusActive: "Active",
                statusInactive: "Inactive",
                statusArchived: "Archived",
                statusFull: "FULL",
                statusExpired: "EXPIRED",
                liveSessions: "Learners connected right now",
                noneParentGroup: "None (top-level group)",
                subgroupNames: "Subgroups (one per line)",
                subgroupNamesHelp: "Enter subgroup names, one per line. They will be created automatically.",
                subgroupsFailedTitle: "Subgroups",
                subgroupsPartialFailure: "{created} of {total} subgroups created. Could not create: {names}",
                subgroupsAllFailed: "The class was created but none of its subgroups could be: {names}"
            }
        },
        fr: {
            classGroups: {
                id: "ID",
                pageTitle: "Groupes",
                name: "Slug URL (auto-généré)",
                display_name: "Nom d'affichage",
                description: "Description",
                owner_user_id: "Propriétaire",
                organization_id: "Organisation",
                subscription_plan_id: "Plan d'abonnement",
                parent_group_id: "Groupe parent",
                max_members: "Membres maximum",
                member_count: "Membres actuels",
                expires_at: "Date d'expiration",
                archived_at: "Archivé le",
                is_active: "Actif",
                is_full: "Complet",
                is_expired: "Expiré",
                metadata: "Métadonnées",
                created_at: "Créé",
                updated_at: "Modifié",
                modify: "Modifier le groupe",
                add: "Créer un groupe",
                delete: "Supprimer le groupe",
                manageMembers: "Gérer les membres",
                noGroups: "Aucun groupe trouvé",
                loading: "Chargement des groupes...",
                saving: "Enregistrement...",
                createSuccess: "Groupe créé avec succès",
                updateSuccess: "Groupe mis à jour avec succès",
                deleteSuccess: "Groupe supprimé avec succès",
                loadError: "Échec du chargement des groupes",
                createError: "Échec de la création du groupe",
                updateError: "Échec de la mise à jour du groupe",
                deleteError: "Échec de la suppression du groupe",
                groupInfo: "Gérez vos classes et équipes",
                nameHelp: "Auto-généré depuis le nom d'affichage (minuscules, tirets uniquement)",
                displayNameHelp: "Nom lisible pour le groupe",
                organizationHelp: "Sélectionnez l'organisation pour ce groupe (vous devez être gestionnaire ou propriétaire)",
                parentGroupHelp: "Groupe parent optionnel pour une organisation hiérarchique",
                maxMembersHelp: "Nombre maximum de membres autorisés dans ce groupe",
                expiresAtHelp: "Date d'expiration optionnelle pour le groupe",
                statusActive: "Actif",
                statusInactive: "Inactif",
                statusArchived: "Archivée",
                statusFull: "COMPLET",
                statusExpired: "EXPIRÉ",
                liveSessions: "Apprenants connectés en ce moment",
                noneParentGroup: "Aucun (groupe de niveau supérieur)",
                subgroupNames: "Sous-groupes (un par ligne)",
                subgroupNamesHelp: "Entrez les noms des sous-groupes, un par ligne. Ils seront créés automatiquement.",
                subgroupsFailedTitle: "Sous-groupes",
                subgroupsPartialFailure: "{created} sous-groupes créés sur {total}. Création impossible pour : {names}",
                subgroupsAllFailed: "La classe a été créée mais aucun de ses sous-groupes n'a pu l'être : {names}"
            }
        }
    })

    const fieldList = buildFieldList([
        field('id', t('classGroups.id')).input().hidden().readonly(),
        field('name', t('classGroups.name')).input().visible().readonly(), // Auto-generated from display_name
        field('display_name', t('classGroups.display_name')).input().visible().editable().required(),
        field('description', t('classGroups.description')).textarea().visible().editable(),
        field('organization_id', t('classGroups.organization_id'))
            .searchableSelect()
            .visible()
            .editable()
            .withOptionsLoader(loadOrganizationsThatCanHoldClasses)
            .withItemValue('id')
            .withItemText('display_name')
            .placeholder(t('classGroups.organizationHelp')),
        field('parent_group_id', t('classGroups.parent_group_id'))
            .searchableSelect()
            .visible()
            .editable()
            .withOptionsLoader(async () => {
                try {
                    const response = await axios.get('/class-groups')
                    const groups = response.data?.data || response.data || []
                    return [
                        { id: null, display_name: t('classGroups.noneParentGroup') },
                        ...groups
                    ]
                } catch (error) {
                    console.error('Failed to load parent groups:', error)
                    return [{ id: null, display_name: t('classGroups.noneParentGroup') }]
                }
            })
            .withItemValue('id')
            .withItemText('display_name')
            .placeholder(t('classGroups.parentGroupHelp')),
        field('max_members', t('classGroups.max_members')).number().visible().editable().required().withMin(1),
        field('expires_at', t('classGroups.expires_at')).date().visible().editable().withDateFormat(),
        // A class is born active: the create form opens with the box checked
        // (an untouched unchecked box would create a class archived at birth).
        // Unchecking stays possible, and edit mode shows the stored value.
        // Archiving goes through the framework action, never through the form.
        field('archived_at', t('classGroups.archived_at')).input().visible().readonly().withDateTimeFormat(),
        field('subgroup_names', t('classGroups.subgroupNames'))
            .textarea()
            .visible()
            .creatable()  // Only show during creation, not editing
            .placeholder(t('classGroups.subgroupNamesHelp'))
            .hint(t('classGroups.subgroupNamesHelp')),
        field('member_count', t('classGroups.member_count')).number().visible().readonly(),
        field('owner_user_id', t('classGroups.owner_user_id')).input().hidden().readonly(),
        field('created_at', t('classGroups.created_at')).input().visible().readonly().withDateTimeFormat(),
        field('updated_at', t('classGroups.updated_at')).input().visible().readonly().withDateTimeFormat(),
    ])

    // Hook to auto-generate slug from display_name before creating
    base.setBeforeCreateHook(async (data: any) => {
        if (data.display_name && !data.name) {
            data.name = generateSlug(data.display_name)
        }
        // A class created without an organization would be invisible the moment
        // it was saved, because every teacher surface is scoped to the active
        // one. So an unanswered organization means "the one I am working in",
        // never "none". An explicit choice is left alone.
        if (!data.organization_id) {
            const currentOrganizationId = useOrganizationsStore().currentOrganization?.id
            if (currentOrganizationId) {
                data.organization_id = currentOrganizationId
            }
        }
        // Handle organization_id conversion to backend camelCase
        if (data.organization_id !== undefined) {
            data.organizationID = data.organization_id
        }
        // Handle parent_group_id conversion to backend camelCase
        if (data.parent_group_id !== undefined && data.parent_group_id !== null && data.parent_group_id !== '') {
            data.parentGroupID = data.parent_group_id
        } else {
            delete data.parent_group_id
            delete data.parentGroupID
        }
        // The generic date field emits "" when untouched and a bare YYYY-MM-DD
        // when set, but the backend decodes expires_at as RFC3339 — both shapes
        // 500 the create (from the console modal and the entity page alike).
        // Empty must be omitted; a picked date means "through that day".
        if (!data.expires_at) {
            delete data.expires_at
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(data.expires_at)) {
            data.expires_at = new Date(`${data.expires_at}T23:59:59`).toISOString()
        }
        // Remove subgroup_names from data sent to backend (it's UI-only)
        const { subgroup_names, ...cleanData } = data
        return cleanData
    })

    /**
     * The parent class is already saved when subgroups are created, so a failed
     * subgroup cannot be rolled back — it can only be reported. Silence here
     * used to let the form close on plain success while TD groups were missing
     * (#305). Notifying from the store mirrors the generations store, which
     * reports job outcomes the same way; Entity.vue is generic and never renders
     * `store.error`, so there is nothing else to hang this on.
     */
    const reportSubgroupFailures = (failedNames: string[], total: number) => {
        if (failedNames.length === 0) return

        const names = failedNames.join(', ')
        const allFailed = failedNames.length === total

        ElNotification({
            title: t('classGroups.subgroupsFailedTitle'),
            message: allFailed
                ? t('classGroups.subgroupsAllFailed', { names })
                : t('classGroups.subgroupsPartialFailure', {
                    created: total - failedNames.length,
                    total,
                    names
                }),
            type: allFailed ? 'error' : 'warning',
            duration: 0 // persistent: the teacher has to recreate them by hand
        })
    }

    // Hook to create subgroups after parent group is created
    base.setAfterCreateHook(async (createdGroup: any, originalData: any) => {
        const subgroupNames = parseSubgroupNames(originalData.subgroup_names)
        if (subgroupNames.length === 0) return

        const organizationId = originalData.organization_id || createdGroup.organization_id
        const failedNames: string[] = []

        for (const displayName of subgroupNames) {
            try {
                // max_members is deliberately omitted: a subgroup is a TD group
                // inside a promotion, so inheriting the parent's cap made a
                // 200-seat class produce 200-seat TD groups. The backend owns
                // the default (ClassGroup.MaxMembers, gorm:"default:50").
                await base.createEntity('/class-groups', {
                    display_name: displayName,
                    name: generateSlug(displayName),
                    organization_id: organizationId,
                    organizationID: organizationId,
                    parent_group_id: createdGroup.id,
                    parentGroupID: createdGroup.id
                })
            } catch (error) {
                console.error(`Failed to create subgroup "${displayName}":`, error)
                failedNames.push(displayName)
            }
        }

        reportSubgroupFailures(failedNames, subgroupNames.length)
    })

    // Hook to auto-generate slug from display_name before updating (if display_name changed)
    base.setBeforeUpdateHook(async (data: any) => {
        if (data.display_name && !data.name) {
            data.name = generateSlug(data.display_name)
        }
        // Handle organization_id conversion to backend camelCase
        if (data.organization_id !== undefined) {
            data.organizationID = data.organization_id
        }
        // Handle parent_group_id conversion to backend camelCase
        if (data.parent_group_id !== undefined) {
            data.parentGroupID = data.parent_group_id
        }
        return data
    })

    // Override loadEntities to use correct endpoint
    const loadEntities = async () => {
        return await base.loadEntities('/class-groups')
    }

    /**
     * Scopes the list to the ACTIVE organization (product decision: teacher
     * surfaces show one organization at a time).
     *
     * Done here rather than in Entity.vue because every consumer of this store
     * asks the same scoped question, and the generic list component must not
     * learn about organizations to serve one entity. The backend turns an
     * unknown query parameter into an exact-match column filter, so this is a
     * real server-side WHERE — not a page of rows filtered down to three.
     *
     * With no active organization yet, the call goes out unscoped rather than
     * with `organization_id=`, which would filter on the empty string and
     * return nothing.
     */
    const loadEntitiesWithCursor = async (
        endpoint: string,
        cursor?: string,
        limit: number = 20,
        filters: Record<string, string> = {},
        demoDataProvider?: () => any[]
    ) => {
        const currentOrganizationId = useOrganizationsStore().currentOrganization?.id
        const scopedFilters = currentOrganizationId
            ? { ...filters, organization_id: currentOrganizationId }
            : filters

        return await base.loadEntitiesWithCursor(endpoint, cursor, limit, scopedFilters, demoDataProvider)
    }

    // Override getOne to use correct endpoint with optional includes
    const getOne = async (groupId: string, includes?: string[]) => {
        if (!includes || includes.length === 0) {
            return await base.getOne('/class-groups', groupId)
        }

        // Custom implementation with includes parameter
        try {
            base.isLoading.value = true
            base.error.value = ''

            const includeParam = includes.join(',')
            const url = `/class-groups/${groupId}?include=${includeParam}`

            const response = await axios.get(url)
            return response.data
        } catch (err: any) {
            base.error.value = err.response?.data?.error_message ||
                               err.response?.data?.message ||
                               t('classGroups.loadError')
            throw err
        } finally {
            base.isLoading.value = false
        }
    }

    // Configure detail view route — the class's live page since the
    // eight-tab detail page was split into per-page routes.
    base.detailRouteName.value = CLASS_PAGE_NAMES.live
    // Classes archive through the framework routes (ocf-core#491).
    base.archivable.value = true

    /**
     * Any mutation of a class must stale the classes console: its store caches
     * member counts and rows behind a TTL, and a teacher returning from a
     * class page must never read pre-mutation numbers (or a deleted class).
     * Declared here — the one place every class-groups mutation goes through —
     * rather than taught to each page that mutates.
     */
    const staleConsoleAfter = <A extends any[], R>(mutate: (...args: A) => Promise<R>) =>
        async (...args: A): Promise<R> => {
            const result = await mutate(...args)
            useTeacherGroupsStore().markStale()
            return result
        }

    return {
        ...base,
        fieldList,
        loadEntities,
        loadEntitiesWithCursor,
        getOne,
        createEntity: staleConsoleAfter(base.createEntity),
        updateEntity: staleConsoleAfter(base.updateEntity),
        deleteEntity: staleConsoleAfter(base.deleteEntity),
        archiveEntity: staleConsoleAfter(base.archiveEntity),
        unarchiveEntity: staleConsoleAfter(base.unarchiveEntity)
    }
})
