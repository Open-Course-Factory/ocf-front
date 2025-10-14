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
import { useChaptersStore } from "./chapters"
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

export const useCoursesStore = defineStore('courses', () => {

    const base = useBaseStore();

    const { t } = useStoreTranslations({
        en: {
            courses: {
                pageTitle: 'Courses',
                name: 'Name',
                format: 'Format',
                authorEmail: 'Author email',
                category: 'Category',
                version: 'Version',
                title: 'Title',
                subTitle: 'Subtitle',
                header: 'Header',
                footer: 'Footer',
                logo: 'Logo file',
                description: 'Description',
                prelude: 'Prelude',
                learningObjectives: 'Learning objectives',
                chapters: 'Chapters',
                add: 'Add a course',
                generate: 'Generate',
            }
        },
        fr: {
            courses: {
                pageTitle: 'Cours',
                name: 'Nom',
                format: 'Format',
                authorEmail: 'Email de l\'auteur',
                category: 'Categorie',
                version: 'Version',
                title: 'Titre',
                subTitle: 'Sous-titre',
                header: 'En-tête',
                footer: 'Pied de page',
                logo: 'Fichier du logo',
                description: 'Description',
                prelude: 'Préambule',
                learningObjectives: 'Objectifs pédagogiques',
                chapters: 'Chapitres',
                add: 'Ajouter un cours',
                generate: 'Générer',
            }
        }
    })

    const fieldList = buildFieldList([
        field('name', t('courses.name')).input().visible().creatable().updatable(),
        field('format', t('courses.format')).input().visible().readonly(),
        field('authorEmail', t('courses.authorEmail')).input().visible().creatable().updatable(),
        field('category', t('courses.category')).input().visible().creatable().updatable(),
        field('version', t('courses.version')).input().visible().creatable().updatable(),
        field('title', t('courses.title')).input().visible().creatable().updatable(),
        field('subTitle', t('courses.subTitle')).input().visible().creatable().updatable(),
        field('header', t('courses.header')).input().visible().creatable().updatable(),
        field('footer', t('courses.footer')).input().visible().creatable().updatable(),
        field('logo', t('courses.logo')).input().visible().creatable().updatable(),
        field('description', t('courses.description')).input().visible().creatable().updatable(),
        field('prelude', t('courses.prelude')).input().visible().creatable().updatable(),
        field('learningObjectives', t('courses.learningObjectives')).input().visible().creatable().updatable(),
        field('chapters', t('courses.chapters')).type('subentity').visible().readonly(),
    ])

    base.subEntitiesStores = new Map<string, any>([
        ["chapters", useChaptersStore()],
    ])

    return {...base, fieldList }
})
