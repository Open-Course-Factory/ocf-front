<!--
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
-->

<template>
  <div class="help-article">
    <div class="help-nav">
      <router-link to="/help" class="back-link">
        <i class="fas fa-arrow-left"></i>
        {{ t('help.navigation.backToHelp') }}
      </router-link>
    </div>

    <div class="article-header">
      <h1><i class="fas fa-calendar-check"></i> {{ t('help.account.subscription.title') }}</h1>
      <p class="article-description">
        {{ t('help.account.subscription.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> Vue d'ensemble des abonnements</h2>
        <p>
          OCF propose différents plans d'abonnement adaptés à vos besoins d'apprentissage et d'enseignement.
          Chaque plan offre un accès à des fonctionnalités spécifiques et des quotas d'utilisation.
        </p>

        <div class="subscription-overview">
          <div class="overview-card">
            <i class="fas fa-user"></i>
            <h4>Plans individuels</h4>
            <p>
              Parfaits pour l'apprentissage personnel et les projets individuels.
              Accès aux terminaux, création de contenu et ressources de base.
            </p>
          </div>

          <div class="overview-card">
            <i class="fas fa-users"></i>
            <h4>Plans éducatifs</h4>
            <p>
              Conçus pour les enseignants et formateurs.
              Fonctionnalités avancées de collaboration et gestion de classes.
            </p>
          </div>

          <div class="overview-card">
            <i class="fas fa-building"></i>
            <h4>Plans entreprise</h4>
            <p>
              Solutions pour les organisations et institutions.
              Support prioritaire, personnalisation et intégrations avancées.
            </p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-tachometer-alt"></i> Tableau de bord abonnement</h2>
        <p>
          Le tableau de bord vous donne une vue complète de votre abonnement actuel et de votre utilisation.
        </p>

        <div class="dashboard-guide">
          <div class="guide-step">
            <div class="step-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="step-content">
              <h4>Suivi de l'utilisation</h4>
              <p>
                Surveillez votre consommation de ressources : sessions terminal actives,
                stockage utilisé, bande passante et autres métriques importantes.
              </p>
              <router-link to="/subscription-dashboard" class="btn btn-primary">
                <i class="fas fa-tachometer-alt"></i>
                Voir le tableau de bord
              </router-link>
            </div>
          </div>

          <div class="guide-step">
            <div class="step-icon">
              <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="step-content">
              <h4>Informations d'abonnement</h4>
              <p>
                Consultez les détails de votre plan actuel : date de renouvellement,
                fonctionnalités incluses, limites et quotas disponibles.
              </p>
            </div>
          </div>

          <div class="guide-step">
            <div class="step-icon">
              <i class="fas fa-bell"></i>
            </div>
            <div class="step-content">
              <h4>Alertes et notifications</h4>
              <p>
                Recevez des alertes lorsque vous approchez de vos limites d'utilisation
                ou lorsque votre abonnement nécessite une attention.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-exchange-alt"></i> Changement de plan</h2>
        <p>
          Vous pouvez modifier votre abonnement à tout moment selon l'évolution de vos besoins.
        </p>

        <div class="plan-change-workflow">
          <div class="workflow-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Évaluer vos besoins</h4>
              <p>
                Analysez votre utilisation actuelle et identifiez les fonctionnalités
                dont vous avez besoin pour optimiser votre choix de plan.
              </p>
            </div>
          </div>

          <div class="workflow-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Comparer les plans</h4>
              <p>
                Explorez les différentes options disponibles et leurs avantages.
                Comparez les fonctionnalités, quotas et tarifs.
              </p>
              <router-link to="/subscription-plans" class="btn btn-outline">
                <i class="fas fa-search"></i>
                Voir les plans disponibles
              </router-link>
            </div>
          </div>

          <div class="workflow-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Effectuer le changement</h4>
              <p>
                Sélectionnez votre nouveau plan et suivez le processus de mise à niveau
                ou de rétrogradation selon vos besoins.
              </p>
            </div>
          </div>
        </div>

        <div class="change-tips">
          <h3>Points importants à retenir :</h3>
          <div class="tip-list">
            <div class="tip-item">
              <i class="fas fa-arrow-up"></i>
              <div>
                <h4>Mise à niveau</h4>
                <p>
                  Les améliorations prennent effet immédiatement.
                  La facturation est ajustée au prorata pour la période en cours.
                </p>
              </div>
            </div>

            <div class="tip-item">
              <i class="fas fa-arrow-down"></i>
              <div>
                <h4>Rétrogradation</h4>
                <p>
                  Les changements vers un plan inférieur prennent généralement effet
                  au prochain cycle de facturation pour éviter la perte de données.
                </p>
              </div>
            </div>

            <div class="tip-item">
              <i class="fas fa-shield-alt"></i>
              <div>
                <h4>Protection des données</h4>
                <p>
                  Vos données et configurations sont préservées lors des changements de plan.
                  Seuls les quotas et fonctionnalités disponibles sont modifiés.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-chart-bar"></i> Optimisation de l'utilisation</h2>
        <p>
          Maximisez la valeur de votre abonnement en adoptant ces bonnes pratiques :
        </p>

        <div class="optimization-grid">
          <div class="optimization-card">
            <i class="fas fa-stopwatch"></i>
            <h4>Gestion des sessions</h4>
            <p>
              Fermez les sessions terminal inutilisées pour économiser vos quotas.
              Utilisez des durées d'expiration appropriées pour vos sessions.
            </p>
          </div>

          <div class="optimization-card">
            <i class="fas fa-database"></i>
            <h4>Stockage efficace</h4>
            <p>
              Nettoyez régulièrement les fichiers temporaires et anciens projets.
              Utilisez des dépôts Git externes pour les gros projets.
            </p>
          </div>

          <div class="optimization-card">
            <i class="fas fa-share-alt"></i>
            <h4>Partage intelligent</h4>
            <p>
              Partagez les ressources avec vos collaborateurs pour éviter
              la duplication et optimiser l'utilisation collective.
            </p>
          </div>

          <div class="optimization-card">
            <i class="fas fa-clock"></i>
            <h4>Planification d'usage</h4>
            <p>
              Planifiez vos activités intensives pendant les heures creuses
              et surveillez vos pics d'utilisation.
            </p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-pause-circle"></i> Suspension et annulation</h2>
        <p>
          Vous avez le contrôle total sur votre abonnement, y compris la possibilité
          de le suspendre temporairement ou de l'annuler définitivement.
        </p>

        <div class="cancellation-options">
          <div class="option-card pause">
            <div class="option-header">
              <i class="fas fa-pause"></i>
              <h4>Suspension temporaire</h4>
            </div>
            <div class="option-content">
              <p>
                Mettez votre abonnement en pause pendant une période déterminée.
                Idéal pour les vacances ou les périodes d'inactivité prévues.
              </p>
              <ul>
                <li>Conservation de toutes vos données</li>
                <li>Arrêt de la facturation pendant la pause</li>
                <li>Reprise facile quand vous le souhaitez</li>
                <li>Durée maximale selon les conditions</li>
              </ul>
            </div>
          </div>

          <div class="option-card cancel">
            <div class="option-header">
              <i class="fas fa-times-circle"></i>
              <h4>Annulation définitive</h4>
            </div>
            <div class="option-content">
              <p>
                Annulez votre abonnement de manière permanente.
                Toutes les données seront supprimées après la période de grâce.
              </p>
              <ul>
                <li>Accès maintenu jusqu'à la fin du cycle payé</li>
                <li>Période de grâce pour récupérer les données</li>
                <li>Suppression définitive après expiration</li>
                <li>Possibilité de réactivation avec nouveau compte</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="warning-box">
          <h4><i class="fas fa-exclamation-triangle"></i> Important</h4>
          <p>
            <strong>Sauvegardez vos données importantes</strong> avant toute suspension ou annulation.
            Bien que nous conservions vos données pendant une période de grâce,
            il est recommandé de faire des sauvegardes locales de vos projets critiques.
          </p>
        </div>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-rocket"></i> Évolution du système d'abonnement</h2>
        <div class="evolution-notice">
          <p>
            <strong>Le système d'abonnement OCF est en développement actif.</strong>
            De nouvelles options de plans, fonctionnalités de facturation et outils
            de gestion seront régulièrement ajoutés pour mieux répondre à vos besoins.
          </p>

          <div class="upcoming-features">
            <h4>Améliorations prévues :</h4>
            <ul>
              <li>Plans personnalisables avec options à la carte</li>
              <li>Facturation basée sur l'utilisation réelle</li>
              <li>Gestion d'équipe et facturation centralisée</li>
              <li>Intégrations avec systèmes de gestion existants</li>
              <li>Analytics avancés d'utilisation</li>
            </ul>
          </div>

          <p>
            Cette documentation sera mise à jour pour refléter les nouvelles fonctionnalités
            au fur et à mesure de leur déploiement.
          </p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> Support et assistance</h2>
        <p>
          Notre équipe support est là pour vous aider avec toutes vos questions d'abonnement :
        </p>

        <div class="support-options">
          <div class="support-card">
            <i class="fas fa-envelope"></i>
            <h4>Support par email</h4>
            <p>Pour les questions générales sur votre abonnement</p>
            <a href="mailto:contact@labinux.com" class="btn btn-outline">
              <i class="fas fa-envelope"></i>
              Contacter le support
            </a>
          </div>

          <div class="support-card">
            <i class="fas fa-credit-card"></i>
            <h4>Questions de facturation</h4>
            <p>Pour les problèmes de paiement et facturation</p>
            <a href="mailto:contact@labinux.com" class="btn btn-outline">
              <i class="fas fa-calculator"></i>
              Support facturation
            </a>
          </div>

          <div class="support-card">
            <i class="fas fa-handshake"></i>
            <h4>Conseils d'optimisation</h4>
            <p>Pour optimiser votre utilisation et choisir le bon plan</p>
            <a href="mailto:contact@labinux.com" class="btn btn-outline">
              <i class="fas fa-lightbulb"></i>
              Demander conseil
            </a>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-arrow-right"></i> Prochaines étapes</h2>
        <div class="next-steps">
          <router-link to="/help/account/billing" class="next-step-card">
            <i class="fas fa-credit-card"></i>
            <h4>Facturation</h4>
            <p>Gérer vos méthodes de paiement et consulter vos factures</p>
          </router-link>

          <router-link to="/subscription-dashboard" class="next-step-card">
            <i class="fas fa-tachometer-alt"></i>
            <h4>Tableau de bord</h4>
            <p>Consulter votre utilisation actuelle et les détails de votre plan</p>
          </router-link>

          <router-link to="/subscription-plans" class="next-step-card">
            <i class="fas fa-list"></i>
            <h4>Plans disponibles</h4>
            <p>Explorer et comparer tous les plans d'abonnement</p>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHelpTranslations } from '../../../composables/useHelpTranslations'

const { t } = useI18n()
const { loadHelpTranslations } = useHelpTranslations()

onMounted(async () => {
  await loadHelpTranslations()
})
</script>

<style scoped>
.help-article {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.help-nav {
  margin-bottom: 30px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: #0056b3;
}

.article-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 2px solid #e9ecef;
}

.article-header h1 {
  color: #333;
  font-size: 2.5rem;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.article-header h1 i {
  color: #007bff;
}

.article-description {
  color: #6c757d;
  font-size: 1.2rem;
  margin: 0;
}

.article-content {
  line-height: 1.6;
}

.help-section {
  margin-bottom: 40px;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.help-section.info {
  background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
  border-left: 4px solid #17a2b8;
}

.help-section h2 {
  color: #333;
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.help-section h2 i {
  color: #007bff;
}

.help-section.info h2 i {
  color: #17a2b8;
}

.help-section h3 {
  color: #333;
  margin: 25px 0 15px 0;
  font-size: 1.2rem;
}

.help-section p {
  color: #555;
  margin-bottom: 15px;
}

.subscription-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.overview-card {
  text-align: center;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.overview-card:hover {
  border-color: #007bff;
  transform: translateY(-5px);
}

.overview-card i {
  font-size: 2.5rem;
  color: #007bff;
  margin-bottom: 15px;
}

.overview-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.overview-card p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
}

.dashboard-guide {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 25px 0;
}

.guide-step {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.step-icon {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  background: #007bff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.step-content {
  flex-grow: 1;
}

.step-content h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.step-content p {
  margin: 0 0 15px 0;
  color: #555;
}

.plan-change-workflow {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 25px 0;
}

.workflow-step {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.step-number {
  background: #28a745;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.workflow-step .step-content {
  flex-grow: 1;
}

.workflow-step .step-content h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.workflow-step .step-content p {
  margin: 0 0 15px 0;
  color: #555;
}

.change-tips {
  margin-top: 30px;
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: #fff3cd;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.tip-item i {
  font-size: 1.3rem;
  color: #856404;
  margin-top: 5px;
  flex-shrink: 0;
}

.tip-item h4 {
  margin: 0 0 5px 0;
  color: #856404;
  font-size: 1rem;
}

.tip-item p {
  margin: 0;
  color: #856404;
  font-size: 0.9rem;
}

.optimization-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.optimization-card {
  text-align: center;
  padding: 20px;
  background: #e8f5e8;
  border: 2px solid #28a745;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.optimization-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.15);
}

.optimization-card i {
  font-size: 2rem;
  color: #28a745;
  margin-bottom: 15px;
}

.optimization-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.optimization-card p {
  margin: 0;
  color: #555;
  font-size: 0.9rem;
  line-height: 1.5;
}

.cancellation-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.option-card {
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid;
  transition: all 0.3s ease;
}

.option-card:hover {
  transform: translateY(-2px);
}

.option-card.pause {
  border-color: #ffc107;
}

.option-card.cancel {
  border-color: #dc3545;
}

.option-header {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.option-card.pause .option-header {
  background: #fff3cd;
  color: #856404;
}

.option-card.cancel .option-header {
  background: #f8d7da;
  color: #721c24;
}

.option-header i {
  font-size: 1.3rem;
}

.option-header h4 {
  margin: 0;
  font-size: 1.1rem;
}

.option-content {
  padding: 20px;
  background: white;
}

.option-content p {
  margin: 0 0 15px 0;
  color: #555;
}

.option-content ul {
  margin: 0;
  padding-left: 20px;
  color: #555;
}

.option-content li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.warning-box {
  background: #f8d7da;
  border: 2px solid #dc3545;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.warning-box h4 {
  margin: 0 0 10px 0;
  color: #721c24;
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-box p {
  margin: 0;
  color: #721c24;
}

.evolution-notice {
  background: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.evolution-notice p {
  margin: 0 0 15px 0;
}

.evolution-notice p:last-child {
  margin: 0;
}

.upcoming-features {
  margin: 15px 0;
}

.upcoming-features h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.upcoming-features ul {
  margin: 0;
  padding-left: 20px;
  color: #555;
}

.upcoming-features li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.support-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.support-card {
  text-align: center;
  padding: 25px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.support-card:hover {
  border-color: #007bff;
  transform: translateY(-5px);
}

.support-card i {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 15px;
}

.support-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.support-card p {
  margin: 0 0 15px 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.next-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.next-step-card {
  display: block;
  padding: 20px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  text-align: center;
}

.next-step-card:hover {
  border-color: #007bff;
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.next-step-card i {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 15px;
}

.next-step-card h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.next-step-card p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.btn-outline {
  background-color: transparent;
  color: #007bff;
  border: 2px solid #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .help-article {
    padding: 10px;
  }

  .article-header h1 {
    font-size: 2rem;
    flex-direction: column;
    gap: 10px;
  }

  .help-section {
    padding: 20px;
  }

  .subscription-overview,
  .optimization-grid,
  .support-options {
    grid-template-columns: 1fr;
  }

  .dashboard-guide .guide-step {
    flex-direction: column;
    text-align: center;
  }

  .plan-change-workflow .workflow-step {
    flex-direction: column;
    text-align: center;
  }

  .cancellation-options {
    grid-template-columns: 1fr;
  }

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>