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
import { computed } from 'vue'
import { useBaseStore } from "./baseStore"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

export const usePlanFeaturesStore = defineStore('planFeatures', () => {

    const base = useBaseStore()

    const { t } = useStoreTranslations({
        en: {
            planFeatures: {
                pageTitle: 'Plan Features',
                key: 'Feature Key',
                displayNameEn: 'Name (EN)',
                displayNameFr: 'Name (FR)',
                description: 'Description',
                category: 'Category',
                valueType: 'Value Type',
                unit: 'Unit',
                defaultValue: 'Default Value',
                isActive: 'Active'
            }
        },
        fr: {
            planFeatures: {
                pageTitle: 'Fonctionnalites des Plans',
                key: 'Cle de fonctionnalite',
                displayNameEn: 'Nom (EN)',
                displayNameFr: 'Nom (FR)',
                description: 'Description',
                category: 'Categorie',
                valueType: 'Type de valeur',
                unit: 'Unite',
                defaultValue: 'Valeur par defaut',
                isActive: 'Actif'
            }
        }
    })

    const featuresByCategory = computed(() => {
        const items = base.entities || []
        const grouped: Record<string, any[]> = {}
        for (const feature of items) {
            if (!feature.is_active) continue
            const cat = feature.category || 'other'
            if (!grouped[cat]) grouped[cat] = []
            grouped[cat].push(feature)
        }
        return grouped
    })

    const fieldList = buildFieldList([
        field('id').hidden().readonly(),
        field('key', t('planFeatures.key')).input().visible().creatable().required(),
        field('display_name_en', t('planFeatures.displayNameEn')).input().visible().creatable().updatable().required(),
        field('display_name_fr', t('planFeatures.displayNameFr')).input().visible().creatable().updatable().required(),
        field('description', t('planFeatures.description')).textarea().visible().creatable().updatable(),
        field('category', t('planFeatures.category')).select().visible().creatable().updatable().required().withOptions([
            { value: 'capabilities', text: 'Capabilities' },
            { value: 'machine_sizes', text: 'Machine Sizes' },
            { value: 'terminal_limits', text: 'Terminal Limits' },
            { value: 'course_limits', text: 'Course Limits' }
        ]),
        field('value_type', t('planFeatures.valueType')).select().visible().creatable().required().withOptions([
            { value: 'boolean', text: 'Boolean' },
            { value: 'number', text: 'Number' }
        ]),
        field('unit', t('planFeatures.unit')).input().visible().creatable().updatable(),
        field('default_value', t('planFeatures.defaultValue')).input().visible().creatable().updatable(),
        field('is_active', t('planFeatures.isActive')).checkbox().visible().creatable().updatable(),
        field('created_at', 'Created At').input().visible().readonly(),
        field('updated_at', 'Updated At').input().visible().readonly()
    ])

    const loadFeatures = async () => {
        return await base.loadEntities('/PlanFeature')
    }

    const refreshFeatures = async () => {
        return await base.refreshEntities('/PlanFeature')
    }

    let featuresLoaded = false
    const ensureFeaturesLoaded = async () => {
        if (!featuresLoaded && base.entities.length === 0) {
            await loadFeatures()
            featuresLoaded = true
        }
    }

    return {
        ...base,
        fieldList,
        featuresByCategory,
        loadFeatures,
        refreshFeatures,
        ensureFeaturesLoaded
    }
})
