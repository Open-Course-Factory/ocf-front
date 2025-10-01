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
      <h1><i class="fas fa-credit-card"></i> {{ t('help.account.billing.title') }}</h1>
      <p class="article-description">
        {{ t('help.account.billing.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> Système de facturation</h2>
        <p>
          OCF utilise un système de facturation automatisé intégré avec Stripe
          pour garantir des paiements sécurisés et une gestion transparente de votre abonnement.
        </p>

        <div class="billing-overview">
          <div class="overview-item">
            <i class="fas fa-calendar-alt"></i>
            <div>
              <h4>Facturation récurrente</h4>
              <p>
                Les abonnements sont facturés automatiquement selon votre cycle choisi
                (mensuel ou annuel). Vous recevez une facture avant chaque prélèvement.
              </p>
            </div>
          </div>

          <div class="overview-item">
            <i class="fas fa-shield-alt"></i>
            <div>
              <h4>Paiements sécurisés</h4>
              <p>
                Tous les paiements sont traités via Stripe, leader mondial
                de la sécurité des paiements en ligne. Vos données sont protégées.
              </p>
            </div>
          </div>

          <div class="overview-item">
            <i class="fas fa-calculator"></i>
            <div>
              <h4>Facturation transparente</h4>
              <p>
                Toutes les charges sont clairement détaillées dans vos factures.
                Pas de frais cachés, seulement ce que vous utilisez et souscrivez.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-credit-card"></i> Méthodes de paiement</h2>
        <p>
          Gérez vos cartes de crédit et autres méthodes de paiement pour assurer
          la continuité de votre service OCF.
        </p>

        <div class="payment-methods-guide">
          <div class="method-section">
            <h3>Types de paiement acceptés :</h3>
            <div class="payment-types">
              <div class="payment-type">
                <i class="fab fa-cc-visa"></i>
                <span>Visa</span>
              </div>
              <div class="payment-type">
                <i class="fab fa-cc-mastercard"></i>
                <span>Mastercard</span>
              </div>
              <div class="payment-type">
                <i class="fab fa-cc-amex"></i>
                <span>American Express</span>
              </div>
              <div class="payment-type">
                <i class="fas fa-university"></i>
                <span>Virement SEPA</span>
              </div>
            </div>
          </div>

          <div class="method-section">
            <h3>Gestion de vos méthodes :</h3>
            <div class="management-actions">
              <div class="action-card">
                <i class="fas fa-plus-circle"></i>
                <h4>Ajouter une méthode</h4>
                <p>Ajoutez une nouvelle carte ou méthode de paiement de secours</p>
                <router-link to="/payment-methods" class="btn btn-primary">
                  <i class="fas fa-credit-card"></i>
                  Gérer les paiements
                </router-link>
              </div>

              <div class="action-card">
                <i class="fas fa-star"></i>
                <h4>Méthode par défaut</h4>
                <p>Définissez quelle méthode utiliser en priorité pour vos factures</p>
              </div>

              <div class="action-card">
                <i class="fas fa-sync-alt"></i>
                <h4>Mise à jour</h4>
                <p>Modifiez les informations d'une carte expirée ou changée</p>
              </div>
            </div>
          </div>
        </div>

        <div class="security-tips">
          <h3>Conseils de sécurité :</h3>
          <div class="security-list">
            <div class="security-item">
              <i class="fas fa-lock"></i>
              <span>Utilisez uniquement des connexions sécurisées (HTTPS)</span>
            </div>
            <div class="security-item">
              <i class="fas fa-eye"></i>
              <span>Vérifiez régulièrement vos relevés bancaires</span>
            </div>
            <div class="security-item">
              <i class="fas fa-bell"></i>
              <span>Activez les notifications de paiement</span>
            </div>
            <div class="security-item">
              <i class="fas fa-trash-alt"></i>
              <span>Supprimez les méthodes de paiement inutilisées</span>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-map-marker-alt"></i> Adresses de facturation</h2>
        <p>
          Configurez vos adresses de facturation pour recevoir des factures conformes
          aux réglementations fiscales de votre pays.
        </p>

        <div class="billing-address-guide">
          <div class="address-importance">
            <h3>Pourquoi c'est important :</h3>
            <ul>
              <li>Conformité fiscale selon votre localisation</li>
              <li>Application correcte de la TVA et taxes locales</li>
              <li>Factures valides pour votre comptabilité</li>
              <li>Respect des réglementations internationales</li>
            </ul>
          </div>

          <div class="address-management">
            <h3>Gestion des adresses :</h3>
            <div class="address-actions">
              <div class="address-action">
                <i class="fas fa-home"></i>
                <div>
                  <h4>Adresse principale</h4>
                  <p>Votre adresse de facturation par défaut</p>
                </div>
              </div>

              <div class="address-action">
                <i class="fas fa-building"></i>
                <div>
                  <h4>Adresses professionnelles</h4>
                  <p>Adresses d'entreprise pour facturation institutionnelle</p>
                </div>
              </div>

              <div class="address-action">
                <i class="fas fa-edit"></i>
                <div>
                  <h4>Modification</h4>
                  <p>Mise à jour en cas de déménagement ou changement</p>
                </div>
              </div>
            </div>

            <router-link to="/billing-addresses" class="btn btn-outline">
              <i class="fas fa-map-marker-alt"></i>
              Gérer les adresses
            </router-link>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-file-invoice"></i> Consultation des factures</h2>
        <p>
          Accédez à toutes vos factures OCF, téléchargez-les et suivez l'historique
          de vos paiements pour votre comptabilité.
        </p>

        <div class="invoice-management">
          <div class="invoice-features">
            <div class="feature-card">
              <i class="fas fa-list"></i>
              <h4>Historique complet</h4>
              <p>
                Consultez toutes vos factures depuis le début de votre abonnement.
                Recherchez par date, montant ou statut.
              </p>
            </div>

            <div class="feature-card">
              <i class="fas fa-download"></i>
              <h4>Téléchargement PDF</h4>
              <p>
                Téléchargez vos factures au format PDF pour votre comptabilité
                ou vos déclarations fiscales.
              </p>
            </div>

            <div class="feature-card">
              <i class="fas fa-info-circle"></i>
              <h4>Détails transparents</h4>
              <p>
                Chaque facture détaille clairement les services utilisés,
                les périodes de facturation et les taxes applicables.
              </p>
            </div>
          </div>

          <div class="invoice-access">
            <h3>Accéder à vos factures :</h3>
            <router-link to="/invoices" class="btn btn-primary">
              <i class="fas fa-file-invoice"></i>
              Consulter mes factures
            </router-link>
          </div>
        </div>

        <div class="invoice-structure">
          <h3>Structure d'une facture OCF :</h3>
          <div class="structure-items">
            <div class="structure-item">
              <span class="structure-label">En-tête :</span>
              <span>Informations OCF et vos coordonnées</span>
            </div>
            <div class="structure-item">
              <span class="structure-label">Période :</span>
              <span>Dates de service et de facturation</span>
            </div>
            <div class="structure-item">
              <span class="structure-label">Détail :</span>
              <span>Services utilisés et tarifs appliqués</span>
            </div>
            <div class="structure-item">
              <span class="structure-label">Taxes :</span>
              <span>TVA et taxes locales selon votre pays</span>
            </div>
            <div class="structure-item">
              <span class="structure-label">Total :</span>
              <span>Montant final et méthode de paiement</span>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-exclamation-triangle"></i> Problèmes de paiement</h2>
        <p>
          Si vous rencontrez des difficultés avec vos paiements, voici les étapes
          à suivre pour résoudre rapidement les problèmes.
        </p>

        <div class="payment-issues">
          <div class="issue-card declined">
            <div class="issue-header">
              <i class="fas fa-times-circle"></i>
              <h4>Paiement refusé</h4>
            </div>
            <div class="issue-content">
              <h5>Causes courantes :</h5>
              <ul>
                <li>Fonds insuffisants sur le compte</li>
                <li>Carte expirée ou bloquée</li>
                <li>Limite de paiement dépassée</li>
                <li>Informations incorrectes</li>
              </ul>
              <h5>Solutions :</h5>
              <ul>
                <li>Vérifiez le solde de votre compte</li>
                <li>Mettez à jour les informations de carte</li>
                <li>Contactez votre banque si nécessaire</li>
                <li>Utilisez une méthode de paiement alternative</li>
              </ul>
            </div>
          </div>

          <div class="issue-card retry">
            <div class="issue-header">
              <i class="fas fa-redo"></i>
              <h4>Nouvelle tentative</h4>
            </div>
            <div class="issue-content">
              <p>
                OCF effectue automatiquement plusieurs tentatives de paiement
                sur quelques jours en cas d'échec initial.
              </p>
              <p>
                Vous recevez des notifications par email pour vous informer
                de la situation et vous permettre de corriger le problème.
              </p>
            </div>
          </div>

          <div class="issue-card suspension">
            <div class="issue-header">
              <i class="fas fa-pause-circle"></i>
              <h4>Suspension du service</h4>
            </div>
            <div class="issue-content">
              <p>
                En cas d'échec répété des paiements, votre service peut être
                temporairement suspendu pour éviter l'accumulation de frais.
              </p>
              <p>
                Votre compte et vos données restent saufs pendant la suspension.
                Le service reprend automatiquement après règlement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-calculator"></i> Remboursements et crédits</h2>
        <p>
          Informations sur les conditions de remboursement et le système de crédits OCF.
        </p>

        <div class="refund-policy">
          <div class="policy-section">
            <h3>Politique de remboursement :</h3>
            <div class="policy-items">
              <div class="policy-item">
                <i class="fas fa-calendar-week"></i>
                <div>
                  <h4>Période d'essai</h4>
                  <p>
                    Remboursement intégral possible pendant les 7 premiers jours
                    de votre première souscription (conditions d'utilisation normale).
                  </p>
                </div>
              </div>

              <div class="policy-item">
                <i class="fas fa-balance-scale"></i>
                <div>
                  <h4>Remboursement au prorata</h4>
                  <p>
                    En cas de rétrogradation ou d'annulation, remboursement
                    calculé sur la période non utilisée.
                  </p>
                </div>
              </div>

              <div class="policy-item">
                <i class="fas fa-bug"></i>
                <div>
                  <h4>Problèmes techniques</h4>
                  <p>
                    Crédits ou remboursements accordés en cas d'interruption
                    prolongée du service due à des problèmes techniques.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="credit-system">
            <h3>Système de crédits :</h3>
            <p>
              OCF peut attribuer des crédits à votre compte pour compenser
              des désagréments ou dans le cadre de promotions spéciales.
            </p>
            <p>
              Les crédits sont automatiquement appliqués à vos prochaines factures
              et apparaissent clairement dans votre historique de facturation.
            </p>
          </div>
        </div>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-tools"></i> Évolution du système de facturation</h2>
        <div class="billing-evolution">
          <p>
            <strong>Le système de facturation OCF continue d'évoluer</strong>
            pour offrir plus de flexibilité et de transparence dans la gestion
            de vos paiements et abonnements.
          </p>

          <div class="upcoming-billing-features">
            <h4>Améliorations en développement :</h4>
            <ul>
              <li>Facturation détaillée par usage réel des ressources</li>
              <li>Options de paiement alternatives (crypto, virements)</li>
              <li>Facturation groupée pour les organisations</li>
              <li>Alertes avancées de consommation et budget</li>
              <li>Intégration avec systèmes comptables d'entreprise</li>
              <li>Devises locales et paiements internationaux optimisés</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-headset"></i> Support facturation</h2>
        <p>
          Notre équipe support est spécialisée dans la résolution rapide
          des problèmes de facturation et de paiement.
        </p>

        <div class="billing-support">
          <div class="support-channels">
            <div class="support-channel">
              <i class="fas fa-envelope"></i>
              <div>
                <h4>Email support</h4>
                <p>Réponse sous 24h pour les questions de facturation</p>
                <a href="mailto:contact@labinux.com?subject=Support Facturation" class="btn btn-outline">
                  <i class="fas fa-envelope"></i>
                  Contacter le support
                </a>
              </div>
            </div>

            <div class="support-channel">
              <i class="fas fa-phone"></i>
              <div>
                <h4>Support prioritaire</h4>
                <p>Assistance téléphonique pour les problèmes urgents de paiement</p>
                <div class="contact-note">
                  <small>Disponible pour les plans entreprise</small>
                </div>
              </div>
            </div>
          </div>

          <div class="support-tips">
            <h4>Pour un support efficace, incluez :</h4>
            <div class="tips-list">
              <div class="tip-point">
                <i class="fas fa-user"></i>
                <span>Votre adresse email de compte</span>
              </div>
              <div class="tip-point">
                <i class="fas fa-file-invoice"></i>
                <span>Numéro de facture concernée</span>
              </div>
              <div class="tip-point">
                <i class="fas fa-calendar"></i>
                <span>Date et heure du problème</span>
              </div>
              <div class="tip-point">
                <i class="fas fa-camera"></i>
                <span>Capture d'écran si applicable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-arrow-right"></i> Ressources utiles</h2>
        <div class="billing-resources">
          <router-link to="/help/account/subscription" class="resource-card">
            <i class="fas fa-calendar-check"></i>
            <h4>Gestion d'abonnement</h4>
            <p>Comprendre et optimiser votre plan OCF</p>
          </router-link>

          <router-link to="/payment-methods" class="resource-card">
            <i class="fas fa-credit-card"></i>
            <h4>Méthodes de paiement</h4>
            <p>Ajouter et gérer vos cartes et comptes</p>
          </router-link>

          <router-link to="/invoices" class="resource-card">
            <i class="fas fa-file-invoice"></i>
            <h4>Mes factures</h4>
            <p>Consulter et télécharger vos factures</p>
          </router-link>

          <router-link to="/billing-addresses" class="resource-card">
            <i class="fas fa-map-marker-alt"></i>
            <h4>Adresses de facturation</h4>
            <p>Configurer vos informations de facturation</p>
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

.billing-overview {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 25px 0;
}

.overview-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.overview-item i {
  font-size: 1.5rem;
  color: #007bff;
  margin-top: 5px;
  flex-shrink: 0;
}

.overview-item h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.1rem;
}

.overview-item p {
  margin: 0;
  color: #555;
  font-size: 0.9rem;
}

.payment-methods-guide {
  margin: 25px 0;
}

.method-section {
  margin-bottom: 25px;
}

.payment-types {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin: 15px 0;
}

.payment-type {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-weight: 500;
  color: #333;
}

.payment-type i {
  font-size: 1.2rem;
  color: #007bff;
}

.management-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 15px 0;
}

.action-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.action-card:hover {
  border-color: #007bff;
  transform: translateY(-5px);
}

.action-card i {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 15px;
}

.action-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.action-card p {
  margin: 0 0 15px 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.security-tips {
  margin-top: 30px;
}

.security-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 15px 0;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #e8f5e8;
  border-radius: 4px;
  border-left: 4px solid #28a745;
}

.security-item i {
  color: #28a745;
  flex-shrink: 0;
}

.security-item span {
  color: #155724;
  font-size: 0.9rem;
}

.billing-address-guide {
  margin: 25px 0;
}

.address-importance {
  margin-bottom: 25px;
}

.address-importance ul {
  margin: 10px 0;
  padding-left: 20px;
  color: #555;
}

.address-importance li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.address-management {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.address-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 15px 0 20px 0;
}

.address-action {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background: white;
  border-radius: 4px;
}

.address-action i {
  font-size: 1.3rem;
  color: #007bff;
  flex-shrink: 0;
}

.address-action h4 {
  margin: 0 0 3px 0;
  color: #333;
  font-size: 1rem;
}

.address-action p {
  margin: 0;
  color: #6c757d;
  font-size: 0.85rem;
}

.invoice-management {
  margin: 25px 0;
}

.invoice-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.feature-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
}

.feature-card i {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 15px;
}

.feature-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.feature-card p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
}

.invoice-access {
  text-align: center;
  margin: 20px 0;
  padding: 20px;
  background: #e3f2fd;
  border-radius: 8px;
  border: 2px solid #2196f3;
}

.invoice-structure {
  margin-top: 25px;
}

.structure-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 15px 0;
}

.structure-item {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.structure-label {
  font-weight: 600;
  color: #333;
  min-width: 100px;
  margin-right: 15px;
}

.structure-item span:last-child {
  color: #555;
  font-size: 0.9rem;
}

.payment-issues {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 25px 0;
}

.issue-card {
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid;
}

.issue-card.declined {
  border-color: #dc3545;
}

.issue-card.retry {
  border-color: #ffc107;
}

.issue-card.suspension {
  border-color: #6c757d;
}

.issue-header {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.issue-card.declined .issue-header {
  background: #f8d7da;
  color: #721c24;
}

.issue-card.retry .issue-header {
  background: #fff3cd;
  color: #856404;
}

.issue-card.suspension .issue-header {
  background: #e2e3e5;
  color: #383d41;
}

.issue-header i {
  font-size: 1.3rem;
}

.issue-header h4 {
  margin: 0;
  font-size: 1.1rem;
}

.issue-content {
  padding: 20px;
  background: white;
}

.issue-content h5 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 0.95rem;
}

.issue-content ul {
  margin: 0 0 15px 20px;
  color: #555;
}

.issue-content li {
  margin-bottom: 3px;
  font-size: 0.85rem;
}

.issue-content p {
  margin: 0 0 10px 0;
  color: #555;
  font-size: 0.9rem;
}

.refund-policy {
  margin: 25px 0;
}

.policy-section {
  margin-bottom: 25px;
}

.policy-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 15px 0;
}

.policy-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.policy-item i {
  font-size: 1.3rem;
  color: #28a745;
  margin-top: 5px;
  flex-shrink: 0;
}

.policy-item h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1rem;
}

.policy-item p {
  margin: 0;
  color: #555;
  font-size: 0.9rem;
}

.credit-system {
  padding: 20px;
  background: #e8f5e8;
  border-radius: 8px;
  border: 2px solid #28a745;
}

.credit-system h3 {
  margin: 0 0 10px 0;
  color: #155724;
}

.credit-system p {
  margin: 0 0 10px 0;
  color: #155724;
  font-size: 0.9rem;
}

.credit-system p:last-child {
  margin: 0;
}

.billing-evolution {
  background: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.billing-evolution p {
  margin: 0 0 15px 0;
}

.upcoming-billing-features {
  margin: 15px 0;
}

.upcoming-billing-features h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.upcoming-billing-features ul {
  margin: 0;
  padding-left: 20px;
  color: #555;
}

.upcoming-billing-features li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.billing-support {
  margin: 25px 0;
}

.support-channels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.support-channel {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.support-channel i {
  font-size: 1.5rem;
  color: #007bff;
  margin-top: 5px;
  flex-shrink: 0;
}

.support-channel h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.1rem;
}

.support-channel p {
  margin: 0 0 15px 0;
  color: #555;
  font-size: 0.9rem;
}

.contact-note {
  margin-top: 5px;
}

.contact-note small {
  color: #6c757d;
  font-style: italic;
}

.support-tips {
  margin-top: 25px;
  padding: 15px;
  background: #fff3cd;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.support-tips h4 {
  margin: 0 0 10px 0;
  color: #856404;
}

.tips-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.tip-point {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #856404;
  font-size: 0.85rem;
}

.tip-point i {
  color: #ffc107;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.billing-resources {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.resource-card {
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

.resource-card:hover {
  border-color: #007bff;
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.resource-card i {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 15px;
}

.resource-card h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1rem;
}

.resource-card p {
  margin: 0;
  color: #6c757d;
  font-size: 0.85rem;
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

  .payment-types {
    justify-content: center;
  }

  .management-actions,
  .invoice-features,
  .support-channels {
    grid-template-columns: 1fr;
  }

  .billing-resources {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .tips-list {
    grid-template-columns: 1fr;
  }
}
</style>