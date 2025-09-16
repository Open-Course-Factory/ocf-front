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

export const useUsageMetricsStore = defineStore('usageMetrics', () => {

    const base = useBaseStore();
    const { t } = useI18n()

    useI18n().mergeLocaleMessage('en', { 
        usageMetrics: { 
            pageTitle: 'Usage Statistics',
            metric_type: 'Metric Type',
            current_value: 'Current Usage',
            limit_value: 'Limit',
            usage_percent: 'Usage Percentage',
            period_start: 'Period Start',
            period_end: 'Period End',
            last_updated: 'Last Updated',
            courses: 'Courses',
            concurrent_users: 'Concurrent Users',
            lab_sessions: 'Lab Sessions',
            storage: 'Storage',
            api_calls: 'API Calls',
            quotaExceeded: 'Quota Exceeded',
            quotaWarning: 'Quota Warning',
            quotaNormal: 'Within Limits',
            remaining: 'remaining',
            unlimited: 'Unlimited',
            modify: 'View metric details', 
            add: 'Add metric',
        }
    })

    useI18n().mergeLocaleMessage('fr', { 
        usageMetrics: { 
            pageTitle: 'Statistiques d\'Utilisation',
            metric_type: 'Type de Métrique',
            current_value: 'Utilisation Actuelle',
            limit_value: 'Limite',
            usage_percent: 'Pourcentage d\'Utilisation',
            period_start: 'Début de Période',
            period_end: 'Fin de Période',
            last_updated: 'Dernière Mise à Jour',
            courses: 'Cours',
            concurrent_users: 'Utilisateurs Concurrents',
            lab_sessions: 'Sessions Lab',
            storage: 'Stockage',
            api_calls: 'Appels API',
            quotaExceeded: 'Quota Dépassé',
            quotaWarning: 'Alerte Quota',
            quotaNormal: 'Dans les Limites',
            remaining: 'restant',
            unlimited: 'Illimité',
            modify: 'Voir les détails de la métrique', 
            add: 'Ajouter une métrique',
        }
    })

    const fieldList = new Map<string, any>([
        ["id", { label: "ID", type: "input", display: false, toBeSet: false, toBeEdited: false }],
        ["metric_type", { label: t('usageMetrics.metric_type'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["current_value", { label: t('usageMetrics.current_value'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["limit_value", { label: t('usageMetrics.limit_value'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["usage_percent", { label: t('usageMetrics.usage_percent'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["period_start", { label: t('usageMetrics.period_start'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["period_end", { label: t('usageMetrics.period_end'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["last_updated", { label: t('usageMetrics.last_updated'), type: "input", display: true, toBeSet: false, toBeEdited: false }],
        ["user_id", { label: "User ID", type: "input", display: false, toBeSet: false, toBeEdited: false }],
    ])

    // Obtenir la classe CSS selon le pourcentage d'usage
    const getUsageClass = (usagePercent: number) => {
        if (usagePercent >= 100) return 'text-danger'; // Rouge si dépassé
        if (usagePercent >= 80) return 'text-warning'; // Orange si > 80%
        if (usagePercent >= 60) return 'text-info'; // Bleu si > 60%
        return 'text-success'; // Vert si < 60%
    }

    // Obtenir l'icône selon le type de métrique
    const getMetricIcon = (metricType: string) => {
        switch (metricType?.toLowerCase()) {
            case 'courses': return 'fas fa-book';
            case 'concurrent_users': return 'fas fa-users';
            case 'lab_sessions': return 'fas fa-flask';
            case 'storage': return 'fas fa-hdd';
            case 'api_calls': return 'fas fa-exchange-alt';
            default: return 'fas fa-chart-bar';
        }
    }

    // Obtenir le statut lisible
    const getUsageStatus = (usagePercent: number) => {
        if (usagePercent >= 100) return t('usageMetrics.quotaExceeded');
        if (usagePercent >= 80) return t('usageMetrics.quotaWarning');
        return t('usageMetrics.quotaNormal');
    }

    // Formater la valeur avec unité
    const formatValue = (value: number, metricType: string) => {
        switch (metricType?.toLowerCase()) {
            case 'storage':
                if (value >= 1073741824) { // GB
                    return `${(value / 1073741824).toFixed(2)} GB`;
                } else if (value >= 1048576) { // MB
                    return `${(value / 1048576).toFixed(2)} MB`;
                } else if (value >= 1024) { // KB
                    return `${(value / 1024).toFixed(2)} KB`;
                } else {
                    return `${value} B`;
                }
            case 'api_calls':
                return value.toLocaleString();
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
            const start = new Date(startDate).toLocaleDateString('fr-FR');
            const end = new Date(endDate).toLocaleDateString('fr-FR');
            return `${start} - ${end}`;
        } catch (e) {
            return `${startDate} - ${endDate}`;
        }
    }

    // Obtenir la barre de progression
    const getProgressBarClass = (usagePercent: number) => {
        if (usagePercent >= 100) return 'bg-danger';
        if (usagePercent >= 80) return 'bg-warning';
        if (usagePercent >= 60) return 'bg-info';
        return 'bg-success';
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