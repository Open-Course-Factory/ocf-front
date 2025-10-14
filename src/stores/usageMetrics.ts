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
import { formatStorageSize, formatNumber, formatDate as formatDateUtil } from '../utils/formatters'
import { useStoreTranslations } from '../composables/useTranslations'
import { field, buildFieldList } from '../utils/fieldBuilder'

export const useUsageMetricsStore = defineStore('usageMetrics', () => {

    const base = useBaseStore();
    const { t } = useStoreTranslations({
        en: {
            usageMetrics: {
                pageTitle: 'Usage Statistics',
                metric_type: 'Metric Type',
                current_value: 'Current Usage',
                limit_value: 'Limit',
                usage_percent: 'Usage Percentage',
                period_start: 'Period Start',
                period_end: 'Period End',
                last_updated: 'Last Updated',
                // Metric types
                courses: 'Courses',
                courses_created: 'Courses Created',
                concurrent_users: 'Concurrent Users',
                concurrent_terminals: 'Concurrent Terminals',
                terminal_sessions: 'Terminal Sessions',
                storage: 'Storage',
                storage_used: 'Storage Used',
                api_calls: 'API Calls',
                users: 'Users',
                active_users: 'Active Users',
                // Status messages
                quotaExceeded: 'Quota Exceeded',
                maxQuotaReached: 'Max quota reached',
                quotaWarning: 'Quota Warning',
                quotaNormal: 'Within Limits',
                remaining: 'remaining',
                unlimited: 'Unlimited',
                modify: 'View metric details',
                add: 'Add metric',
            }
        },
        fr: {
            usageMetrics: {
                pageTitle: 'Statistiques d\'Utilisation',
                metric_type: 'Type de Métrique',
                current_value: 'Utilisation Actuelle',
                limit_value: 'Limite',
                usage_percent: 'Pourcentage d\'Utilisation',
                period_start: 'Début de Période',
                period_end: 'Fin de Période',
                last_updated: 'Dernière Mise à Jour',
                // Types de métriques
                courses: 'Cours',
                courses_created: 'Cours Créés',
                concurrent_users: 'Utilisateurs Concurrents',
                concurrent_terminals: 'Terminaux Concurrents',
                terminal_sessions: 'Sessions Terminal',
                storage: 'Stockage',
                storage_used: 'Stockage Utilisé',
                api_calls: 'Appels API',
                users: 'Utilisateurs',
                active_users: 'Utilisateurs Actifs',
                // Messages de statut
                quotaExceeded: 'Quota Dépassé',
                maxQuotaReached: 'Quota maximum atteint',
                quotaWarning: 'Alerte Quota',
                quotaNormal: 'Dans les Limites',
                remaining: 'restant',
                unlimited: 'Illimité',
                modify: 'Voir les détails de la métrique',
                add: 'Ajouter une métrique',
            }
        }
    })

    const fieldList = buildFieldList([
        field('id', 'ID').input().hidden().readonly(),
        field('metric_type', t('usageMetrics.metric_type')).input().visible().readonly(),
        field('current_value', t('usageMetrics.current_value')).input().visible().readonly(),
        field('limit_value', t('usageMetrics.limit_value')).input().visible().readonly(),
        field('usage_percent', t('usageMetrics.usage_percent')).input().visible().readonly(),
        field('period_start', t('usageMetrics.period_start')).input().visible().readonly(),
        field('period_end', t('usageMetrics.period_end')).input().visible().readonly(),
        field('last_updated', t('usageMetrics.last_updated')).input().visible().readonly(),
        field('user_id', 'User ID').input().hidden().readonly(),
    ])

    // Obtenir la classe CSS selon le pourcentage d'usage
    const getUsageClass = (usagePercent: number) => {
        if (usagePercent > 100) return 'text-danger'; // Rouge si vraiment dépassé
        if (usagePercent >= 100) return 'text-warning'; // Orange si quota atteint
        if (usagePercent >= 80) return 'text-warning'; // Orange si > 80%
        if (usagePercent >= 60) return 'text-info'; // Bleu si > 60%
        return 'text-success'; // Vert si < 60%
    }

    // Obtenir l'icône selon le type de métrique
    const getMetricIcon = (metricType: string) => {
        switch (metricType?.toLowerCase()) {
            case 'courses':
            case 'courses_created':
                return 'fas fa-book';
            case 'users':
            case 'active_users':
            case 'concurrent_users':
                return 'fas fa-users';
            case 'concurrent_terminals':
            case 'terminal_sessions':
                return 'fas fa-terminal';
            case 'storage':
            case 'storage_used':
                return 'fas fa-hdd';
            case 'api_calls':
                return 'fas fa-exchange-alt';
            default:
                return 'fas fa-chart-bar';
        }
    }

    // Obtenir le statut lisible
    const getUsageStatus = (usagePercent: number) => {
        if (usagePercent > 100) return t('usageMetrics.quotaExceeded');
        if (usagePercent >= 100) return t('usageMetrics.maxQuotaReached');
        if (usagePercent >= 80) return t('usageMetrics.quotaWarning');
        return t('usageMetrics.quotaNormal');
    }

    // Formater la valeur avec unité
    const formatValue = (value: number, metricType: string) => {
        switch (metricType?.toLowerCase()) {
            case 'storage':
                return formatStorageSize(value);
            case 'api_calls':
                return formatNumber(value);
            default:
                return value.toString();
        }
    }

    // Formater la limite
    const formatLimit = (limit: number, metricType: string) => {
        if (limit === -1) return t('usageMetrics.unlimited');
        return formatValue(limit, metricType);
    }

    // Calculer la valeur restante
    const getRemainingValue = (current: number, limit: number) => {
        if (limit === -1) return -1; // Illimité
        return Math.max(0, limit - current);
    }

    // Formater la période
    const formatPeriod = (startDate: string, endDate: string) => {
        if (!startDate || !endDate) return '-';
        try {
            const start = formatDateUtil(startDate);
            const end = formatDateUtil(endDate);
            return `${start} - ${end}`;
        } catch (e) {
            return `${startDate} - ${endDate}`;
        }
    }

    // Obtenir la barre de progression
    const getProgressBarClass = (usagePercent: number) => {
        if (usagePercent > 100) return 'bg-danger'; // Rouge si vraiment dépassé
        if (usagePercent >= 100) return 'bg-warning'; // Orange si quota atteint
        if (usagePercent >= 80) return 'bg-warning'; // Orange si > 80%
        if (usagePercent >= 60) return 'bg-info'; // Bleu si > 60%
        return 'bg-success'; // Vert si < 60%
    }

    // Fonction personnalisée pour les données de sélection
    const getSelectDatas = (inputEntities: any[]) => {
        let res: Array<{text: string, value: string}> = []
        if (inputEntities.length > 0) {
            inputEntities.forEach((metric) => {
                const current = formatValue(metric.current_value, metric.metric_type);
                const limit = formatLimit(metric.limit_value, metric.metric_type);
                const displayName = `${metric.metric_type}: ${current}/${limit} (${metric.usage_percent?.toFixed(1)}%)`;
                res.push({ 
                    text: displayName, 
                    value: metric.id 
                })
            })
        }
        return res
    }

    return {
        ...base, 
        fieldList,
        getUsageClass,
        getMetricIcon,
        getUsageStatus,
        formatValue,
        formatLimit,
        getRemainingValue,
        formatPeriod,
        getProgressBarClass,
        getSelectDatas
    }
})