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
import { createAsyncWrapper } from '../utils/asyncWrapper'
import axios from 'axios'

export const useEmailTemplatesStore = defineStore('emailTemplates', () => {

    const base = useBaseStore();

    const { t } = useStoreTranslations({
        en: {
            emailTemplates: {
                pageTitle: 'Email Templates',
                name: 'Template Name',
                display_name: 'Display Name',
                description: 'Description',
                subject: 'Subject Line',
                html_body: 'HTML Body',
                variables: 'Variables',
                is_active: 'Active',
                is_system: 'System Template',
                created_at: 'Created At',
                updated_at: 'Updated At',
                last_tested_at: 'Last Tested',
                modify: 'Modify template',
                add: 'Add template',
                testEmail: 'Send Test Email',
                testEmailSuccess: 'Test email sent successfully to',
                testEmailError: 'Failed to send test email',
                deleteError: 'Cannot delete system templates',
                deleteConfirm: 'Are you sure you want to delete this template?',
                basicInfo: 'Basic Information',
                sendTest: 'Send Test',
                emailAddress: 'Email Address',
                enterEmail: 'Enter email address',
                cancel: 'Cancel',
                sending: 'Sending...',
                active: 'Active',
                inactive: 'Inactive',
                system: 'System',
                custom: 'Custom',
                noTemplates: 'No email templates found',
                loadError: 'Failed to load email templates',
                createError: 'Failed to create email template',
                updateError: 'Failed to update email template',
                deleteSuccess: 'Email template deleted successfully'
            }
        },
        fr: {
            emailTemplates: {
                pageTitle: 'Modèles d\'Email',
                name: 'Nom du Modèle',
                display_name: 'Nom d\'Affichage',
                description: 'Description',
                subject: 'Ligne de Sujet',
                html_body: 'Corps HTML',
                variables: 'Variables',
                is_active: 'Actif',
                is_system: 'Modèle Système',
                created_at: 'Créé le',
                updated_at: 'Mis à jour le',
                last_tested_at: 'Dernier Test',
                modify: 'Modifier le modèle',
                add: 'Ajouter un modèle',
                testEmail: 'Envoyer un Email de Test',
                testEmailSuccess: 'Email de test envoyé avec succès à',
                testEmailError: 'Échec de l\'envoi de l\'email de test',
                deleteError: 'Impossible de supprimer les modèles système',
                deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce modèle ?',
                basicInfo: 'Informations de Base',
                sendTest: 'Envoyer un Test',
                emailAddress: 'Adresse Email',
                enterEmail: 'Entrez l\'adresse email',
                cancel: 'Annuler',
                sending: 'Envoi...',
                active: 'Actif',
                inactive: 'Inactif',
                system: 'Système',
                custom: 'Personnalisé',
                noTemplates: 'Aucun modèle d\'email trouvé',
                loadError: 'Échec du chargement des modèles d\'email',
                createError: 'Échec de la création du modèle d\'email',
                updateError: 'Échec de la mise à jour du modèle d\'email',
                deleteSuccess: 'Modèle d\'email supprimé avec succès'
            }
        }
    })

    // Create async wrapper with base store state
    const baseAsync = createAsyncWrapper({ isLoading: base.isLoading, error: base.error })

    const fieldList = buildFieldList([
        field('id').hidden().readonly(),
        field('name', t('emailTemplates.name')).input().visible().creatable().required(),
        field('display_name', t('emailTemplates.display_name')).input().visible().creatable().updatable().required(),
        field('description', t('emailTemplates.description')).textarea().visible().creatable().updatable(),
        field('subject', t('emailTemplates.subject')).input().visible().creatable().updatable().required(),
        field('html_body', t('emailTemplates.html_body')).type('code').visible().creatable().updatable().required(),
        field('variables', t('emailTemplates.variables')).type('json').visible().creatable().updatable(),
        field('is_active', t('emailTemplates.is_active')).checkbox().visible().creatable().updatable(),
        field('is_system', t('emailTemplates.is_system')).checkbox().visible().readonly(),
        field('created_at', t('emailTemplates.created_at')).readonly().visible(),
        field('updated_at', t('emailTemplates.updated_at')).readonly().visible(),
        field('last_tested_at', t('emailTemplates.last_tested_at')).readonly().visible()
    ])

    // Load email templates
    const loadTemplates = async () => {
        return await base.loadEntities('/email-templates')
    }

    // Get single template
    const getTemplate = async (id: string) => {
        return await base.getOne('/email-templates', id)
    }

    // Create template
    const createTemplate = async (templateData: any) => {
        return await base.createEntity('/email-templates', templateData)
    }

    // Update template
    const updateTemplate = async (id: string, templateData: any) => {
        return await base.updateEntity('/email-templates', id, templateData)
    }

    // Delete template
    const deleteTemplate = async (id: string, isSystem: boolean) => {
        if (isSystem) {
            base.error.value = t('emailTemplates.deleteError')
            throw new Error(t('emailTemplates.deleteError'))
        }
        return await base.deleteEntity('/email-templates', id)
    }

    // Send test email
    const sendTestEmail = async (templateId: string, email: string) => {
        return await baseAsync(
            async () => {
                const response = await axios.post(`/email-templates/${templateId}/test`, {
                    email
                })
                return response.data
            },
            'emailTemplates.testEmailError'
        )
    }

    return {
        ...base,
        fieldList,
        loadTemplates,
        getTemplate,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        sendTestEmail,
        t
    }
})
