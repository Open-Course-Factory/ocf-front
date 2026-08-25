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
import { useBaseStore } from "./baseStore"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

/**
 * Platform settings, as registered by each module at startup.
 *
 * Two shapes share this table. Most rows are plain on/off module toggles, where
 * `enabled` is the whole answer. A few carry configuration in `value` — the
 * terminal launcher's hidden-distribution list is one — and for those `value`
 * is the field that matters.
 *
 * `key` and `module` are seeded by the backend and shown read-only: editing a
 * key here would orphan the setting from the code reading it, rather than
 * rename anything.
 */
export const useFeaturesStore = defineStore('features', () => {

    const base = useBaseStore()

    const { t } = useStoreTranslations({
        en: {
            features: {
                pageTitle: 'Platform Settings',
                key: 'Key',
                name: 'Name',
                description: 'Description',
                enabled: 'Enabled',
                category: 'Category',
                module: 'Module',
                value: 'Value',
                valueHint: 'Configuration for settings that need more than on/off. Leave blank for a plain toggle.'
            }
        },
        fr: {
            features: {
                pageTitle: 'Paramètres de la plateforme',
                key: 'Clé',
                name: 'Nom',
                description: 'Description',
                enabled: 'Activé',
                category: 'Catégorie',
                module: 'Module',
                value: 'Valeur',
                valueHint: 'Configuration des paramètres qui ne se résument pas à activé/désactivé. Laissez vide pour un simple interrupteur.'
            }
        }
    })

    // Settings are registered by each module at startup, so neither action is
    // meaningful here — and one of them is dangerous. Creating a row nothing
    // reads does nothing. Deleting one is worse than it looks: IsFeatureEnabled
    // treats a missing row as ENABLED, so removing a disabled setting turns the
    // thing back on, and the next boot re-seeds it at its code default, making
    // the flip permanent. Production has disabled settings today.
    base.allowCreation.value = false
    base.allowDeletion.value = false

    const fieldList = computed(() => buildFieldList([
        field('id').hidden().readonly(),
        field('key', t('features.key')).input().visible().readonly(),
        field('name', t('features.name')).input().visible().creatable().updatable().required(),
        field('description', t('features.description')).textarea().visible().creatable().updatable(),
        field('enabled', t('features.enabled')).checkbox().visible().creatable().updatable(),
        field('value', t('features.value')).textarea().visible().creatable().updatable()
            .hint(t('features.valueHint')),
        field('category', t('features.category')).input().visible().readonly(),
        field('module', t('features.module')).input().visible().readonly()
    ]))

    return { ...base, fieldList }
})
