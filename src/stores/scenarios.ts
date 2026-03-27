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

export const useScenariosStore = defineStore('scenarios', () => {

    const base = useBaseStore()

    const { t } = useStoreTranslations({
        en: {
            scenarios: {
                pageTitle: 'Scenarios',
                name: 'Name',
                title: 'Title',
                description: 'Description',
                difficulty: 'Difficulty',
                estimatedTime: 'Estimated Time',
                instanceType: 'Instance Type',
                sourceType: 'Source Type',
                gitRepository: 'Git Repository',
                gitBranch: 'Git Branch',
                flagsEnabled: 'Flags Enabled',
                gshEnabled: 'GSH Enabled',
                crashTraps: 'Crash Traps',
                introText: 'Introduction Text',
                finishText: 'Finish Text',
                setupScriptId: 'Setup Script',
                introFileId: 'Intro File',
                finishFileId: 'Finish File',
                createdById: 'Created By',
                createdAt: 'Created At',
                updatedAt: 'Updated At',
                difficultyBeginner: 'Beginner',
                difficultyIntermediate: 'Intermediate',
                difficultyAdvanced: 'Advanced',
                sourceTypeGit: 'Git',
                sourceTypeUpload: 'Upload',
                sourceTypeBuiltin: 'Builtin',
                sourceTypeSeed: 'Seed',
                os_type: 'OS Type',
                osTypeDeb: 'Debian-based (apt)',
                osTypeRpm: 'RPM-based (dnf/yum)',
                osTypeApk: 'Alpine (apk)',
                osTypePacman: 'Arch-based (pacman)',
                hostname: 'Container Hostname',
                hostnameHelp: 'Custom hostname displayed in the terminal prompt (e.g., webserver)'
            }
        },
        fr: {
            scenarios: {
                pageTitle: 'Scénarios',
                name: 'Nom',
                title: 'Titre',
                description: 'Description',
                difficulty: 'Difficulté',
                estimatedTime: 'Temps estimé',
                instanceType: 'Type d\'instance',
                sourceType: 'Type de source',
                gitRepository: 'Dépôt Git',
                gitBranch: 'Branche Git',
                flagsEnabled: 'Drapeaux activés',
                gshEnabled: 'GSH activé',
                crashTraps: 'Pièges de crash',
                introText: 'Texte d\'introduction',
                finishText: 'Texte de fin',
                setupScriptId: 'Script d\'installation',
                introFileId: 'Fichier d\'introduction',
                finishFileId: 'Fichier de fin',
                createdById: 'Créé par',
                createdAt: 'Date de création',
                updatedAt: 'Date de modification',
                difficultyBeginner: 'Débutant',
                difficultyIntermediate: 'Intermédiaire',
                difficultyAdvanced: 'Avancé',
                sourceTypeGit: 'Git',
                sourceTypeUpload: 'Upload',
                sourceTypeBuiltin: 'Intégré',
                sourceTypeSeed: 'Seed',
                os_type: 'Type d\'OS',
                osTypeDeb: 'Debian (apt)',
                osTypeRpm: 'RPM (dnf/yum)',
                osTypeApk: 'Alpine (apk)',
                osTypePacman: 'Arch (pacman)',
                hostname: 'Nom d\'hôte du conteneur',
                hostnameHelp: 'Nom d\'hôte personnalisé affiché dans le terminal (ex. webserver)'
            }
        }
    })

    const fieldList = computed(() => buildFieldList([
        field('id').hidden().readonly(),
        field('name', t('scenarios.name')).input().visible().creatable().required(),
        field('title', t('scenarios.title')).input().visible().creatable().updatable().required(),
        field('description', t('scenarios.description')).textarea().visible().creatable().updatable(),
        field('difficulty', t('scenarios.difficulty')).select().visible().creatable().updatable().withOptions([
            { value: 'beginner', text: t('scenarios.difficultyBeginner') },
            { value: 'intermediate', text: t('scenarios.difficultyIntermediate') },
            { value: 'advanced', text: t('scenarios.difficultyAdvanced') }
        ]),
        field('estimated_time', t('scenarios.estimatedTime')).input().visible().creatable().updatable(),
        field('instance_type', t('scenarios.instanceType')).input().visible().creatable().updatable().required(),
        field('hostname', t('scenarios.hostname')).input().visible().creatable().updatable(),
        field('os_type', t('scenarios.os_type')).select().visible().creatable().updatable().withOptions([
            { value: 'deb', text: t('scenarios.osTypeDeb') },
            { value: 'rpm', text: t('scenarios.osTypeRpm') },
            { value: 'apk', text: t('scenarios.osTypeApk') },
            { value: 'pacman', text: t('scenarios.osTypePacman') }
        ]),
        field('source_type', t('scenarios.sourceType')).select().visible().creatable().updatable().withOptions([
            { value: 'git', text: t('scenarios.sourceTypeGit') },
            { value: 'upload', text: t('scenarios.sourceTypeUpload') },
            { value: 'builtin', text: t('scenarios.sourceTypeBuiltin') },
            { value: 'seed', text: t('scenarios.sourceTypeSeed') }
        ]),
        field('git_repository', t('scenarios.gitRepository')).input().visible().creatable().updatable(),
        field('git_branch', t('scenarios.gitBranch')).input().visible().creatable().updatable(),
        field('flags_enabled', t('scenarios.flagsEnabled')).checkbox().visible().creatable().updatable(),
        field('gsh_enabled', t('scenarios.gshEnabled')).checkbox().visible().creatable().updatable(),
        field('crash_traps', t('scenarios.crashTraps')).checkbox().visible().creatable().updatable(),
        field('intro_text', t('scenarios.introText')).textarea().visible().creatable().updatable(),
        field('finish_text', t('scenarios.finishText')).textarea().visible().creatable().updatable(),
        field('setup_script_id', t('scenarios.setupScriptId')).input().visible().creatable().updatable(),
        field('intro_file_id', t('scenarios.introFileId')).input().visible().creatable().updatable(),
        field('finish_file_id', t('scenarios.finishFileId')).input().visible().creatable().updatable(),
        field('created_by_id', t('scenarios.createdById')).input().visible().readonly(),
        field('created_at', t('scenarios.createdAt')).input().visible().readonly(),
        field('updated_at', t('scenarios.updatedAt')).input().visible().readonly()
    ]))

    return { ...base, fieldList }
})
