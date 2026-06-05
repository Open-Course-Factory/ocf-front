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
import { computed } from 'vue'
import axios from 'axios'
import { useBaseStore } from "./baseStore"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

export const useOrganizationRolePlansStore = defineStore('organizationRolePlans', () => {

    const base = useBaseStore()

    const { t } = useStoreTranslations({
        en: {
            organizationRolePlans: {
                pageTitle: 'Organization Role Plans',
                organization_id: 'Organization',
                role: 'Role',
                subscription_plan_id: 'Subscription Plan',
                created_at: 'Created at',
                updated_at: 'Updated at',
                roleOwner: 'Owner',
                roleManager: 'Manager',
                roleMember: 'Member',
                add: 'Add a role plan mapping',
                modify: 'Modify the role plan mapping'
            }
        },
        fr: {
            organizationRolePlans: {
                pageTitle: 'Plans par Rôle d\'Organisation',
                organization_id: 'Organisation',
                role: 'Rôle',
                subscription_plan_id: 'Plan d\'Abonnement',
                created_at: 'Créé le',
                updated_at: 'Modifié le',
                roleOwner: 'Propriétaire',
                roleManager: 'Gestionnaire',
                roleMember: 'Membre',
                add: 'Ajouter une association rôle-plan',
                modify: 'Modifier l\'association rôle-plan'
            }
        }
    })

    const fieldList = computed(() => buildFieldList([
        field('id').hidden().readonly(),
        field('organization_id', t('organizationRolePlans.organization_id'))
            .searchableSelect()
            .visible()
            .creatable()
            .required()
            .withOptionsLoader(async () => {
                try {
                    const response = await axios.get('/organizations?limit=100')
                    const orgs: any[] = response.data?.data || response.data || []
                    return orgs.map((o: any) => ({
                        value: o.id,
                        text: o.display_name || o.name,
                        id: o.id
                    }))
                } catch {
                    return []
                }
            })
            .withItemValue('id')
            .withItemText('text'),
        field('role', t('organizationRolePlans.role'))
            .select()
            .visible()
            .creatable()
            .updatable()
            .required()
            .withOptions([
                { value: 'owner', text: t('organizationRolePlans.roleOwner') },
                { value: 'manager', text: t('organizationRolePlans.roleManager') },
                { value: 'member', text: t('organizationRolePlans.roleMember') }
            ]),
        field('subscription_plan_id', t('organizationRolePlans.subscription_plan_id'))
            .searchableSelect()
            .visible()
            .creatable()
            .updatable()
            .required()
            .withOptionsLoader(async () => {
                try {
                    const response = await axios.get('/subscription-plans')
                    const plans: any[] = response.data?.data || response.data || []
                    return plans.map((p: any) => ({
                        value: p.id,
                        text: p.name,
                        id: p.id
                    }))
                } catch {
                    return []
                }
            })
            .withItemValue('id')
            .withItemText('text'),
        field('created_at', t('organizationRolePlans.created_at')).input().visible().readonly(),
        field('updated_at', t('organizationRolePlans.updated_at')).input().visible().readonly()
    ]))

    const loadRolePlans = async () => {
        return await base.loadEntities('/organization-role-plans')
    }

    const refreshRolePlans = async () => {
        return await base.refreshEntities('/organization-role-plans')
    }

    let rolePlansLoaded = false
    const ensureLoaded = async () => {
        if (!rolePlansLoaded && base.entities.length === 0) {
            await loadRolePlans()
            rolePlansLoaded = true
        }
    }

    return {
        ...base,
        fieldList,
        loadRolePlans,
        refreshRolePlans,
        ensureLoaded
    }
})
