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
import { useBaseStore } from "./baseStore";
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'


export const useSchedulesStore = defineStore('schedules', () => {

    const base = useBaseStore();
    const { t } = useStoreTranslations({
        en: {
            schedules: {
                id: "id",
                pageTitle: 'Schedules',
                name: 'Schedule Name',
                front_matter_content: 'Content',
                modify: 'Modify the schedule',
                add: 'Add a schedule',
            }
        },
        fr: {
            schedules: {
                id: "id",
                pageTitle: 'Emplois du temps',
                name: 'Nom de l\'emploi du temps',
                front_matter_content: 'Contenu',
                modify: 'Modifier l\'emploi du temps',
                add: 'Ajouter un emploi du temps',
            }
        }
    })

    const fieldList = buildFieldList([
        field('id', t('schedules.id')).input().hidden().readonly(),
        field('name', t('schedules.name')).input().visible().editable(),
        field('front_matter_content', t('schedules.front_matter_content')).type('advanced-textarea').visible().editable(),
        field('created_at', t('created_at')).input().visible().readonly(),
        field('updated_at', t('updated_at')).input().visible().readonly(),
    ])

    base.subEntitiesStores = new Map<string, any>([
    ])


    return {...base, fieldList}
})