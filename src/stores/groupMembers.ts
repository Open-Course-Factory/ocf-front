/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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
import { useBaseStore } from "./baseStore"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

export const useGroupMembersStore = defineStore('groupMembers', () => {
    const base = useBaseStore()

    const { t } = useStoreTranslations({
        en: {
            groupMembers: {
                id: "ID",
                pageTitle: "Group Members",
                group_id: "Group",
                user_id: "User",
                role: "Role",
                invited_by: "Invited by",
                joined_at: "Joined at",
                is_active: "Active",
                metadata: "Metadata",
                created_at: "Created",
                updated_at: "Updated",
                modify: "Modify member",
                add: "Add member",
                delete: "Remove member",
                noMembers: "No members found",
                loading: "Loading members...",
                saving: "Saving...",
                createSuccess: "Member added successfully",
                updateSuccess: "Member updated successfully",
                deleteSuccess: "Member removed successfully",
                loadError: "Failed to load members",
                createError: "Failed to add member",
                updateError: "Failed to update member",
                deleteError: "Failed to remove member",
                memberInfo: "Manage group membership",
                roleOwner: "Owner",
                roleAdmin: "Admin",
                roleAssistant: "Assistant",
                roleMember: "Member",
                roleHelp: "Role determines permissions within the group"
            }
        },
        fr: {
            groupMembers: {
                id: "ID",
                pageTitle: "Membres du groupe",
                group_id: "Groupe",
                user_id: "Utilisateur",
                role: "Rôle",
                invited_by: "Invité par",
                joined_at: "Rejoint le",
                is_active: "Actif",
                metadata: "Métadonnées",
                created_at: "Créé",
                updated_at: "Modifié",
                modify: "Modifier le membre",
                add: "Ajouter un membre",
                delete: "Retirer le membre",
                noMembers: "Aucun membre trouvé",
                loading: "Chargement des membres...",
                saving: "Enregistrement...",
                createSuccess: "Membre ajouté avec succès",
                updateSuccess: "Membre mis à jour avec succès",
                deleteSuccess: "Membre retiré avec succès",
                loadError: "Échec du chargement des membres",
                createError: "Échec de l'ajout du membre",
                updateError: "Échec de la mise à jour du membre",
                deleteError: "Échec du retrait du membre",
                memberInfo: "Gérer l'appartenance au groupe",
                roleOwner: "Propriétaire",
                roleAdmin: "Administrateur",
                roleAssistant: "Assistant",
                roleMember: "Membre",
                roleHelp: "Le rôle détermine les permissions dans le groupe"
            }
        }
    })

    const fieldList = buildFieldList([
        field('id', t('groupMembers.id')).input().hidden().readonly(),
        field('group_id', t('groupMembers.group_id')).input().visible().creatable(),
        field('user_id', t('groupMembers.user_id')).input().visible().creatable(),
        field('role', t('groupMembers.role')).select().withOptions([
            { label: t('groupMembers.roleOwner'), value: 'owner' },
            { label: t('groupMembers.roleAdmin'), value: 'admin' },
            { label: t('groupMembers.roleAssistant'), value: 'assistant' },
            { label: t('groupMembers.roleMember'), value: 'member' }
        ]).visible().editable(),
        field('invited_by', t('groupMembers.invited_by')).input().visible().readonly(),
        field('joined_at', t('groupMembers.joined_at')).date().visible().readonly().withDateTimeFormat(),
        field('is_active', t('groupMembers.is_active')).checkbox().visible().editable(),
        field('created_at', t('groupMembers.created_at')).input().visible().readonly().withDateTimeFormat(),
        field('updated_at', t('groupMembers.updated_at')).input().visible().readonly().withDateTimeFormat(),
    ])

    // Override loadEntities to use correct endpoint
    const loadEntities = async () => {
        return await base.loadEntities('/group-members')
    }

    return {
        ...base,
        fieldList,
        loadEntities
    }
})
