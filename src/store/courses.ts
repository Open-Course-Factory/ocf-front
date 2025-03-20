/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
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
import { useI18n } from "vue-i18n"
import { useBaseStore } from "./baseStore"
import { useChaptersStore } from "./chapters"


export const useCoursesStore = defineStore('Courses', () => {

    const base = useBaseStore();

    useI18n().mergeLocaleMessage('en', { courses : { 
        pageTitle: 'Courses',
        name: 'Name',
        theme: 'Theme',
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
        schedule: 'Schedule',
        prelude: 'Prelude',
        learningObjectives: 'Learning objectives',
        chapters: 'Chapters',
        add: 'Add a course',
    }})
    useI18n().mergeLocaleMessage('fr', { courses : { 
        pageTitle: 'Cours',
        name: 'Nom',
        theme: 'Theme',
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
        schedule: 'Emploi du temps',
        prelude: 'Préambule',
        learningObjectives: 'Objectifs pédagogiques',
        chapters: 'Chapitres',
        add: 'Ajouter un cours',
     }})

  

    const { t } = useI18n()

    const fieldList = new Map<string, any>([
        ["name", { label: t('courses.name'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["theme", { label: t('courses.theme'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["format", { label: t('courses.format'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["authorEmail", { label: t('courses.authorEmail'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["category", { label: t('courses.category'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["version", { label: t('courses.version'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["title", { label: t('courses.title'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["subTitle", { label: t('courses.subTitle'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["header", { label: t('courses.header'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["footer", { label: t('courses.footer'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["logo", { label: t('courses.logo'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["description", { label: t('courses.description'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["schedule", { label: t('courses.schedule'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["prelude", { label: t('courses.prelude'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["learningObjectives", { label: t('courses.learningObjectives'), type: "input", display: true, toBeSet: true, toBeEdited: true }],
        ["chapters", { label: t('courses.chapters'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
    ])

    base.subEntitiesStores = new Map<string, any>([
        ["chapters", useChaptersStore()],
    ])

    return {...base, fieldList }
})
