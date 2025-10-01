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
        Retour au Centre d'Aide
      </router-link>
    </div>

    <div class="article-header">
      <h1><i class="fas fa-wrench"></i> Dépannage Terminal</h1>
      <p class="article-description">
        Solutions aux problèmes courants et guide de résolution des incidents
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-search"></i> Diagnostic rapide</h2>
        <p>
          Avant de chercher une solution spécifique, effectuez ces vérifications de base :
        </p>

        <div class="diagnostic-checklist">
          <div class="check-item">
            <input type="checkbox" id="check1">
            <label for="check1">
              <i class="fas fa-wifi"></i>
              Connexion Internet stable
            </label>
          </div>
          <div class="check-item">
            <input type="checkbox" id="check2">
            <label for="check2">
              <i class="fas fa-browser"></i>
              Navigateur à jour (Chrome, Firefox, Safari, Edge)
            </label>
          </div>
          <div class="check-item">
            <input type="checkbox" id="check3">
            <label for="check3">
              <i class="fas fa-key"></i>
              Clé d'accès terminal active
            </label>
          </div>
          <div class="check-item">
            <input type="checkbox" id="check4">
            <label for="check4">
              <i class="fas fa-clock"></i>
              Session non expirée
            </label>
          </div>
          <div class="check-item">
            <input type="checkbox" id="check5">
            <label for="check5">
              <i class="fas fa-shield-alt"></i>
              Pas de bloqueur de publicités/scripts sur le domaine
            </label>
          </div>
        </div>

        <div class="quick-actions">
          <h3>Actions rapides :</h3>
          <router-link to="/terminal-sessions" class="btn btn-primary">
            <i class="fas fa-sync"></i>
            Synchroniser mes sessions
          </router-link>
          <router-link to="/user-terminal-keys" class="btn btn-outline">
            <i class="fas fa-key"></i>
            Vérifier ma clé d'accès
          </router-link>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-exclamation-triangle"></i> Problèmes de connexion</h2>

        <div class="problem-card">
          <div class="problem-header">
            <i class="fas fa-times-circle"></i>
            <h3>Impossible de créer une session</h3>
          </div>
          <div class="problem-content">
            <h4>Causes possibles :</h4>
            <ul>
              <li>Clé d'accès terminal manquante ou inactive</li>
              <li>Limite de sessions simultanées atteinte</li>
              <li>Problème temporaire du serveur</li>
              <li>Quota d'utilisation dépassé</li>
            </ul>
            <h4>Solutions :</h4>
            <div class="solution-steps">
              <div class="solution-step">
                <span class="step-number">1</span>
                <div>
                  <strong>Vérifiez votre clé d'accès :</strong>
                  <p>Allez dans "Clés d'Accès Terminal" et régénérez votre clé si nécessaire</p>
                </div>
              </div>
              <div class="solution-step">
                <span class="step-number">2</span>
                <div>
                  <strong>Fermez les sessions inutiles :</strong>
                  <p>Arrêtez les sessions actives que vous n'utilisez plus</p>
                </div>
              </div>
              <div class="solution-step">
                <span class="step-number">3</span>
                <div>
                  <strong>Attendez et réessayez :</strong>
                  <p>Patientez quelques minutes puis tentez une nouvelle création</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="problem-card">
          <div class="problem-header">
            <i class="fas fa-plug"></i>
            <h3>Terminal ne s'affiche pas ou écran noir</h3>
          </div>
          <div class="problem-content">
            <h4>Causes possibles :</h4>
            <ul>
              <li>Bloqueur de contenu actif</li>
              <li>WebSocket bloqué par le réseau/firewall</li>
              <li>Session expirée ou arrêtée</li>
              <li>Problème de navigateur</li>
            </ul>
            <h4>Solutions :</h4>
            <div class="solution-steps">
              <div class="solution-step">
                <span class="step-number">1</span>
                <div>
                  <strong>Désactivez les bloqueurs :</strong>
                  <p>Mettez le domaine OCF en liste blanche dans vos extensions</p>
                </div>
              </div>
              <div class="solution-step">
                <span class="step-number">2</span>
                <div>
                  <strong>Essayez un autre navigateur :</strong>
                  <p>Testez avec Chrome, Firefox ou Edge en navigation privée</p>
                </div>
              </div>
              <div class="solution-step">
                <span class="step-number">3</span>
                <div>
                  <strong>Vérifiez le statut de la session :</strong>
                  <p>Synchronisez la session pour confirmer qu'elle est active</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="problem-card">
          <div class="problem-header">
            <i class="fas fa-keyboard"></i>
            <h3>Clavier ne répond pas ou caractères incorrects</h3>
          </div>
          <div class="problem-content">
            <h4>Causes possibles :</h4>
            <ul>
              <li>Configuration clavier incorrecte</li>
              <li>Conflit avec raccourcis navigateur</li>
              <li>Délai de réseau élevé</li>
              <li>Focus perdu sur le terminal</li>
            </ul>
            <h4>Solutions :</h4>
            <div class="solution-steps">
              <div class="solution-step">
                <span class="step-number">1</span>
                <div>
                  <strong>Cliquez dans le terminal :</strong>
                  <p>Assurez-vous que le focus est bien sur la zone de terminal</p>
                </div>
              </div>
              <div class="solution-step">
                <span class="step-number">2</span>
                <div>
                  <strong>Configurez le clavier :</strong>
                  <p>Utilisez <code>sudo dpkg-reconfigure keyboard-configuration</code></p>
                </div>
              </div>
              <div class="solution-step">
                <span class="step-number">3</span>
                <div>
                  <strong>Rechargez la page :</strong>
                  <p>Actualisez (F5) pour rétablir la connexion</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-share-alt"></i> Problèmes de partage</h2>

        <div class="problem-card">
          <div class="problem-header">
            <i class="fas fa-ban"></i>
            <h3>Impossible de partager un terminal</h3>
          </div>
          <div class="problem-content">
            <h4>Vérifications :</h4>
            <ul>
              <li>La session est-elle active ?</li>
              <li>L'utilisateur destinataire existe-t-il ?</li>
              <li>Avez-vous les permissions de partage ?</li>
            </ul>
            <h4>Solution :</h4>
            <p>Synchronisez d'abord votre session, puis réessayez le partage avec un email valide.</p>
          </div>
        </div>

        <div class="problem-card">
          <div class="problem-header">
            <i class="fas fa-eye-slash"></i>
            <h3>Utilisateur ne peut pas accéder au terminal partagé</h3>
          </div>
          <div class="problem-content">
            <h4>Points à vérifier :</h4>
            <ul>
              <li>Le partage n'a pas expiré</li>
              <li>L'utilisateur est connecté à son compte</li>
              <li>Les permissions sont correctes</li>
              <li>La session source est toujours active</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-tachometer-alt"></i> Problèmes de performance</h2>

        <div class="performance-tips">
          <div class="tip-card">
            <i class="fas fa-rocket"></i>
            <h4>Terminal lent ou qui rame</h4>
            <ul>
              <li>Fermez les onglets/applications inutiles</li>
              <li>Vérifiez votre connexion Internet</li>
              <li>Réduisez le nombre d'utilisateurs connectés</li>
              <li>Redémarrez votre navigateur</li>
            </ul>
          </div>

          <div class="tip-card">
            <i class="fas fa-memory"></i>
            <h4>Session qui se fige</h4>
            <ul>
              <li>Évitez les processus consommant beaucoup de mémoire</li>
              <li>Tuez les processus bloqués avec <code>Ctrl+C</code></li>
              <li>Redémarrez la session si nécessaire</li>
              <li>Contactez le support si le problème persiste</li>
            </ul>
          </div>

          <div class="tip-card">
            <i class="fas fa-network-wired"></i>
            <h4>Déconnexions fréquentes</h4>
            <ul>
              <li>Vérifiez la stabilité de votre réseau</li>
              <li>Désactivez les VPN si possible</li>
              <li>Changez de réseau (4G/WiFi)</li>
              <li>Utilisez une connexion filaire si disponible</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-cogs"></i> Problèmes de synchronisation</h2>

        <div class="sync-issues">
          <div class="issue-item">
            <i class="fas fa-sync-alt"></i>
            <div>
              <h4>Statut de session incorrect</h4>
              <p>
                Utilisez le bouton "Sync" pour mettre à jour le statut.
                Si le problème persiste, attendez quelques minutes et réessayez.
              </p>
            </div>
          </div>

          <div class="issue-item">
            <i class="fas fa-clock"></i>
            <div>
              <h4>Dates d'expiration incohérentes</h4>
              <p>
                La synchronisation globale ("Tout synchroniser") résout généralement ce problème.
                Vérifiez aussi les fuseaux horaires de votre système.
              </p>
            </div>
          </div>

          <div class="issue-item">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <h4>Erreurs de synchronisation</h4>
              <p>
                Ces erreurs sont souvent temporaires. Patientez quelques minutes
                et relancez la synchronisation. Contactez le support si elles persistent.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section warning">
        <h2><i class="fas fa-life-ring"></i> Quand contacter le support</h2>
        <p>
          Contactez notre équipe support dans ces situations :
        </p>

        <div class="support-triggers">
          <div class="trigger-item critical">
            <i class="fas fa-exclamation-circle"></i>
            <div>
              <h4>Critique - Contact immédiat</h4>
              <ul>
                <li>Perte de données importantes non sauvegardées</li>
                <li>Accès non autorisé à vos sessions</li>
                <li>Facturation incorrecte ou charges inattendues</li>
                <li>Problème de sécurité suspecté</li>
              </ul>
            </div>
          </div>

          <div class="trigger-item high">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <h4>Important - Contact sous 24h</h4>
              <ul>
                <li>Impossible de créer des sessions depuis plusieurs jours</li>
                <li>Erreurs persistantes malgré les solutions tentées</li>
                <li>Problèmes de performance généralisés</li>
                <li>Fonctionnalités de partage non fonctionnelles</li>
              </ul>
            </div>
          </div>

          <div class="trigger-item normal">
            <i class="fas fa-info-circle"></i>
            <div>
              <h4>Normal - Support général</h4>
              <ul>
                <li>Questions sur l'utilisation des fonctionnalités</li>
                <li>Demandes d'amélioration ou suggestions</li>
                <li>Aide pour optimiser votre utilisation</li>
                <li>Formation ou accompagnement</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="contact-info">
          <h3>Informations à inclure dans votre demande :</h3>
          <div class="info-checklist">
            <div class="info-item">
              <i class="fas fa-user"></i>
              <span>Votre nom d'utilisateur et email</span>
            </div>
            <div class="info-item">
              <i class="fas fa-calendar"></i>
              <span>Date et heure du problème</span>
            </div>
            <div class="info-item">
              <i class="fas fa-list"></i>
              <span>Description détaillée des étapes effectuées</span>
            </div>
            <div class="info-item">
              <i class="fas fa-browser"></i>
              <span>Navigateur et version utilisés</span>
            </div>
            <div class="info-item">
              <i class="fas fa-desktop"></i>
              <span>Système d'exploitation (Windows, Mac, Linux)</span>
            </div>
            <div class="info-item">
              <i class="fas fa-camera"></i>
              <span>Captures d'écran des erreurs (si possible)</span>
            </div>
          </div>

          <div class="contact-action">
            <a href="mailto:contact@labinux.com" class="btn btn-primary">
              <i class="fas fa-envelope"></i>
              Contacter le Support
            </a>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-lightbulb"></i> Conseils de prévention</h2>
        <p>
          Adoptez ces bonnes pratiques pour éviter les problèmes :
        </p>

        <div class="prevention-tips">
          <div class="prevention-category">
            <h4><i class="fas fa-save"></i> Sauvegarde</h4>
            <ul>
              <li>Sauvegardez régulièrement vos fichiers importants</li>
              <li>Utilisez Git pour versionner votre code</li>
              <li>Téléchargez les données critiques localement</li>
              <li>Documentez vos configurations importantes</li>
            </ul>
          </div>

          <div class="prevention-category">
            <h4><i class="fas fa-clock"></i> Gestion du temps</h4>
            <ul>
              <li>Surveillez les dates d'expiration de vos sessions</li>
              <li>Prolongez les sessions actives avant expiration</li>
              <li>Planifiez votre travail selon les limites de temps</li>
              <li>Arrêtez les sessions inutilisées</li>
            </ul>
          </div>

          <div class="prevention-category">
            <h4><i class="fas fa-shield-alt"></i> Sécurité</h4>
            <ul>
              <li>Ne partagez jamais vos clés d'accès</li>
              <li>Révoquez les partages dès qu'ils ne sont plus nécessaires</li>
              <li>Vérifiez les accès accordés régulièrement</li>
              <li>Utilisez des mots de passe forts pour vos comptes</li>
            </ul>
          </div>

          <div class="prevention-category">
            <h4><i class="fas fa-tools"></i> Maintenance</h4>
            <ul>
              <li>Gardez votre navigateur à jour</li>
              <li>Nettoyez le cache régulièrement</li>
              <li>Synchronisez vos sessions fréquemment</li>
              <li>Surveillez l'utilisation de vos ressources</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> Ressources supplémentaires</h2>
        <div class="resources-grid">
          <router-link to="/help/terminals/getting-started" class="resource-card">
            <i class="fas fa-play-circle"></i>
            <h4>Guide de démarrage</h4>
            <p>Retour aux bases pour une configuration optimale</p>
          </router-link>

          <router-link to="/help/terminals/managing-sessions" class="resource-card">
            <i class="fas fa-cogs"></i>
            <h4>Gestion des sessions</h4>
            <p>Optimisez votre utilisation des sessions terminal</p>
          </router-link>

          <router-link to="/help/terminals/sharing" class="resource-card">
            <i class="fas fa-share-alt"></i>
            <h4>Partage et collaboration</h4>
            <p>Maîtrisez les fonctionnalités de partage</p>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// Pas de logique spéciale nécessaire pour cette page
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

.help-section.warning {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border-left: 4px solid #ffc107;
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

.help-section.warning h2 i {
  color: #ffc107;
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

.diagnostic-checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.check-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #007bff;
}

.check-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
  font-weight: 500;
  cursor: pointer;
}

.check-item label i {
  color: #007bff;
  width: 20px;
}

.quick-actions {
  margin-top: 25px;
  padding: 20px;
  background: #e3f2fd;
  border-radius: 8px;
  border: 2px solid #2196f3;
}

.quick-actions h3 {
  margin: 0 0 15px 0;
  color: #1976d2;
}

.problem-card {
  margin: 25px 0;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.problem-header {
  background: #f8d7da;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #f5c6cb;
}

.problem-header i {
  color: #721c24;
  font-size: 1.3rem;
}

.problem-header h3 {
  margin: 0;
  color: #721c24;
  font-size: 1.1rem;
}

.problem-content {
  padding: 20px;
  background: white;
}

.problem-content h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1rem;
}

.problem-content ul {
  margin: 0 0 15px 20px;
  color: #555;
}

.solution-steps {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 15px 0;
}

.solution-step {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.step-number {
  background: #007bff;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.solution-step div {
  flex-grow: 1;
}

.solution-step strong {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

.solution-step p {
  margin: 0;
  color: #555;
  font-size: 0.9rem;
}

.solution-step code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.85rem;
}

.performance-tips {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.tip-card {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.tip-card i {
  font-size: 1.5rem;
  color: #007bff;
  margin-bottom: 10px;
}

.tip-card h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1rem;
}

.tip-card ul {
  margin: 0;
  padding-left: 20px;
  color: #555;
}

.tip-card li {
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.sync-issues {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.issue-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: #fff3cd;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.issue-item i {
  font-size: 1.3rem;
  color: #856404;
  margin-top: 5px;
  flex-shrink: 0;
}

.issue-item h4 {
  margin: 0 0 5px 0;
  color: #856404;
  font-size: 1rem;
}

.issue-item p {
  margin: 0;
  color: #856404;
  font-size: 0.9rem;
}

.support-triggers {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
}

.trigger-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid;
}

.trigger-item.critical {
  background: #f8d7da;
  border-color: #dc3545;
}

.trigger-item.high {
  background: #fff3cd;
  border-color: #ffc107;
}

.trigger-item.normal {
  background: #d1ecf1;
  border-color: #17a2b8;
}

.trigger-item i {
  font-size: 1.5rem;
  margin-top: 5px;
  flex-shrink: 0;
}

.trigger-item.critical i {
  color: #721c24;
}

.trigger-item.high i {
  color: #856404;
}

.trigger-item.normal i {
  color: #0c5460;
}

.trigger-item h4 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
}

.trigger-item.critical h4 {
  color: #721c24;
}

.trigger-item.high h4 {
  color: #856404;
}

.trigger-item.normal h4 {
  color: #0c5460;
}

.trigger-item ul {
  margin: 0;
  padding-left: 20px;
}

.trigger-item li {
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.contact-info {
  margin-top: 30px;
  padding: 25px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
}

.contact-info h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.info-checklist {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
  margin: 15px 0 25px 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.info-item i {
  color: #007bff;
  width: 16px;
}

.info-item span {
  font-size: 0.9rem;
  color: #555;
}

.contact-action {
  text-align: center;
}

.prevention-tips {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.prevention-category {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.prevention-category h4 {
  margin: 0 0 15px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.prevention-category h4 i {
  color: #007bff;
}

.prevention-category ul {
  margin: 0;
  padding-left: 20px;
  color: #555;
}

.prevention-category li {
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
  font-size: 1.1rem;
}

.resource-card p {
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
  margin-right: 10px;
  margin-bottom: 10px;
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

  .performance-tips,
  .prevention-tips {
    grid-template-columns: 1fr;
  }

  .solution-step {
    flex-direction: column;
    text-align: center;
  }

  .trigger-item {
    flex-direction: column;
    text-align: center;
  }

  .info-checklist {
    grid-template-columns: 1fr;
  }

  .resources-grid {
    grid-template-columns: 1fr;
  }
}
</style>