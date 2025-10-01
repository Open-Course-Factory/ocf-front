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
      <h1><i class="fas fa-share-alt"></i> Partage et Collaboration</h1>
      <p class="article-description">
        Apprenez à partager vos terminaux et collaborer efficacement avec d'autres utilisateurs
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> Aperçu du partage de terminaux</h2>
        <p>
          Le système de partage OCF vous permet de donner accès à vos sessions terminal à d'autres utilisateurs,
          facilitant ainsi la collaboration, l'assistance technique et l'enseignement.
        </p>

        <div class="feature-grid">
          <div class="feature-card">
            <i class="fas fa-users"></i>
            <h4>Collaboration en temps réel</h4>
            <p>Plusieurs utilisateurs peuvent accéder simultanément au même terminal</p>
          </div>

          <div class="feature-card">
            <i class="fas fa-lock"></i>
            <h4>Contrôle d'accès</h4>
            <p>Gérez qui peut voir et interagir avec vos sessions</p>
          </div>

          <div class="feature-card">
            <i class="fas fa-clock"></i>
            <h4>Partage temporaire</h4>
            <p>Définissez des durées de partage pour un contrôle optimal</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-share"></i> Partager un terminal</h2>
        <p>
          Pour partager l'une de vos sessions actives avec d'autres utilisateurs :
        </p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>Accéder au partage</h4>
            <p>
              Dans <strong>Mes Sessions</strong>, cliquez sur le bouton <strong>"Partager"</strong>
              à côté de la session que vous souhaitez partager.
            </p>
            <router-link to="/terminal-sessions" class="btn btn-primary">
              <i class="fas fa-terminal"></i>
              Voir mes sessions
            </router-link>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>Configurer le partage</h4>
            <p>Dans la fenêtre de partage, vous pouvez :</p>
            <ul>
              <li>Entrer l'email ou l'identifiant de l'utilisateur destinataire</li>
              <li>Définir le type d'accès (lecture seule ou lecture/écriture)</li>
              <li>Spécifier une durée d'expiration pour le partage</li>
              <li>Ajouter un message optionnel pour le destinataire</li>
            </ul>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>Envoyer l'invitation</h4>
            <p>
              Cliquez sur <strong>"Partager"</strong> pour envoyer l'invitation.
              Le destinataire recevra une notification et pourra accéder au terminal partagé.
            </p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-users-cog"></i> Gestion des accès</h2>
        <p>
          Utilisez le système de gestion des accès pour contrôler finement qui peut utiliser vos terminaux :
        </p>

        <div class="access-types">
          <div class="access-card readonly">
            <div class="access-icon">
              <i class="fas fa-eye"></i>
            </div>
            <div class="access-content">
              <h4>Accès Lecture Seule</h4>
              <p>
                L'utilisateur peut voir le terminal et suivre votre travail,
                mais ne peut pas taper de commandes ou modifier les fichiers.
              </p>
              <div class="access-features">
                <span class="feature-tag">👁️ Observation</span>
                <span class="feature-tag">📺 Démonstration</span>
                <span class="feature-tag">🎓 Enseignement</span>
              </div>
            </div>
          </div>

          <div class="access-card readwrite">
            <div class="access-icon">
              <i class="fas fa-edit"></i>
            </div>
            <div class="access-content">
              <h4>Accès Lecture/Écriture</h4>
              <p>
                L'utilisateur a un contrôle complet du terminal et peut
                exécuter des commandes, modifier des fichiers et collaborer activement.
              </p>
              <div class="access-features">
                <span class="feature-tag">⌨️ Commandes</span>
                <span class="feature-tag">✏️ Édition</span>
                <span class="feature-tag">🤝 Collaboration</span>
              </div>
            </div>
          </div>
        </div>

        <div class="management-actions">
          <h3>Actions de gestion disponibles :</h3>
          <div class="action-list">
            <div class="action-item">
              <i class="fas fa-users-cog"></i>
              <div>
                <h4>Gérer les accès</h4>
                <p>Cliquez sur "Accès" pour voir tous les utilisateurs ayant accès à votre terminal</p>
              </div>
            </div>

            <div class="action-item">
              <i class="fas fa-ban"></i>
              <div>
                <h4>Révoquer un accès</h4>
                <p>Supprimez l'accès d'un utilisateur à tout moment depuis la fenêtre de gestion</p>
              </div>
            </div>

            <div class="action-item">
              <i class="fas fa-clock"></i>
              <div>
                <h4>Modifier la durée</h4>
                <p>Prolongez ou raccourcissez la durée d'accès d'un partage existant</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-inbox"></i> Accéder aux terminaux partagés</h2>
        <p>
          Lorsque quelqu'un partage un terminal avec vous, voici comment y accéder :
        </p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>Consulter les sessions partagées</h4>
            <p>
              Naviguez vers <strong>Travaux Pratiques > Sessions Partagées</strong>
              pour voir tous les terminaux auxquels vous avez accès.
            </p>
            <router-link to="/terminal-shared" class="btn btn-outline">
              <i class="fas fa-share-alt"></i>
              Voir les sessions partagées
            </router-link>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>Vérifier les permissions</h4>
            <p>
              Chaque session partagée affiche clairement :
            </p>
            <ul>
              <li>Le propriétaire du terminal</li>
              <li>Votre type d'accès (lecture ou lecture/écriture)</li>
              <li>La date d'expiration du partage</li>
              <li>Les informations de connexion</li>
            </ul>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>Se connecter au terminal</h4>
            <p>
              Cliquez sur <strong>"Ouvrir"</strong> pour accéder au terminal partagé.
              Respectez les permissions qui vous ont été accordées.
            </p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-chalkboard-teacher"></i> Cas d'usage courants</h2>
        <p>
          Voici quelques scénarios typiques d'utilisation du partage de terminaux :
        </p>

        <div class="usecase-grid">
          <div class="usecase-card">
            <i class="fas fa-graduation-cap"></i>
            <h4>Enseignement</h4>
            <p>
              Un enseignant partage son terminal en <strong>lecture seule</strong> avec ses étudiants
              pour faire des démonstrations en direct ou montrer des exemples.
            </p>
          </div>

          <div class="usecase-card">
            <i class="fas fa-hands-helping"></i>
            <h4>Support technique</h4>
            <p>
              Un expert reçoit un accès <strong>lecture/écriture</strong> temporaire
              pour diagnostiquer et résoudre un problème technique.
            </p>
          </div>

          <div class="usecase-card">
            <i class="fas fa-code-branch"></i>
            <h4>Développement collaboratif</h4>
            <p>
              Plusieurs développeurs travaillent ensemble sur un projet,
              partageant l'accès à un environnement de développement commun.
            </p>
          </div>

          <div class="usecase-card">
            <i class="fas fa-user-graduate"></i>
            <h4>Mentorat</h4>
            <p>
              Un mentor guide un étudiant en temps réel,
              alternant entre observation et assistance directe.
            </p>
          </div>
        </div>
      </section>

      <section class="help-section warning">
        <h2><i class="fas fa-shield-alt"></i> Bonnes pratiques de sécurité</h2>
        <div class="security-guidelines">
          <div class="guideline-item">
            <i class="fas fa-user-check"></i>
            <div>
              <h4>Vérifiez l'identité</h4>
              <p>Assurez-vous toujours de l'identité de la personne avant de partager un accès</p>
            </div>
          </div>

          <div class="guideline-item">
            <i class="fas fa-clock"></i>
            <div>
              <h4>Limitez la durée</h4>
              <p>Définissez toujours une durée d'expiration appropriée pour vos partages</p>
            </div>
          </div>

          <div class="guideline-item">
            <i class="fas fa-eye"></i>
            <div>
              <h4>Surveillez l'activité</h4>
              <p>Gardez un œil sur ce qui se passe dans vos terminaux partagés</p>
            </div>
          </div>

          <div class="guideline-item">
            <i class="fas fa-save"></i>
            <div>
              <h4>Sauvegardez avant</h4>
              <p>Sauvegardez vos données importantes avant de donner un accès en écriture</p>
            </div>
          </div>

          <div class="guideline-item">
            <i class="fas fa-ban"></i>
            <div>
              <h4>Révoquez rapidement</h4>
              <p>N'hésitez pas à révoquer un accès dès qu'il n'est plus nécessaire</p>
            </div>
          </div>

          <div class="guideline-item">
            <i class="fas fa-file-contract"></i>
            <div>
              <h4>Respectez les données</h4>
              <p>Ne partagez jamais de terminaux contenant des données sensibles ou confidentielles</p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-exclamation-triangle"></i> Limitations et considérations</h2>
        <p>
          Gardez à l'esprit ces limitations lors de l'utilisation du partage :
        </p>

        <div class="limitation-list">
          <div class="limitation-item">
            <i class="fas fa-users"></i>
            <div>
              <h4>Nombre d'utilisateurs simultanés</h4>
              <p>Le nombre d'utilisateurs pouvant accéder simultanément à un terminal peut être limité selon votre abonnement</p>
            </div>
          </div>

          <div class="limitation-item">
            <i class="fas fa-network-wired"></i>
            <div>
              <h4>Performance réseau</h4>
              <p>Les performances peuvent être affectées avec de nombreux utilisateurs connectés simultanément</p>
            </div>
          </div>

          <div class="limitation-item">
            <i class="fas fa-sync-alt"></i>
            <div>
              <h4>Synchronisation</h4>
              <p>Il peut y avoir un léger délai dans la synchronisation des actions entre utilisateurs</p>
            </div>
          </div>

          <div class="limitation-item">
            <i class="fas fa-history"></i>
            <div>
              <h4>Historique partagé</h4>
              <p>Tous les utilisateurs voient le même historique de commandes et les mêmes fichiers</p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> Prochaines étapes</h2>
        <div class="next-steps">
          <router-link to="/help/terminals/managing-sessions" class="next-step-card">
            <i class="fas fa-cogs"></i>
            <h4>Gestion des Sessions</h4>
            <p>Apprenez à gérer efficacement toutes vos sessions terminal</p>
          </router-link>

          <router-link to="/help/terminals/troubleshooting" class="next-step-card">
            <i class="fas fa-wrench"></i>
            <h4>Dépannage</h4>
            <p>Solutions aux problèmes de partage et de collaboration</p>
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

.help-section ul {
  color: #555;
  margin-left: 20px;
}

.help-section li {
  margin-bottom: 8px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.feature-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
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
}

.step-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
  border-left: 4px solid #007bff;
}

.step-number {
  background: #007bff;
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

.step-content ul {
  margin: 10px 0 15px 20px;
}

.access-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.access-card {
  display: flex;
  gap: 20px;
  padding: 25px;
  border-radius: 8px;
  border: 2px solid;
}

.access-card.readonly {
  background: #e3f2fd;
  border-color: #2196f3;
}

.access-card.readwrite {
  background: #e8f5e8;
  border-color: #4caf50;
}

.access-icon {
  flex-shrink: 0;
}

.access-card.readonly .access-icon i {
  font-size: 2rem;
  color: #1976d2;
}

.access-card.readwrite .access-icon i {
  font-size: 2rem;
  color: #388e3c;
}

.access-content h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.access-content p {
  margin: 0 0 15px 0;
  color: #555;
  font-size: 0.9rem;
}

.access-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-tag {
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.management-actions {
  margin-top: 30px;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.action-item i {
  font-size: 1.3rem;
  color: #007bff;
  margin-top: 5px;
}

.action-item h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1rem;
}

.action-item p {
  margin: 0;
  color: #555;
  font-size: 0.9rem;
}

.usecase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.usecase-card {
  text-align: center;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.usecase-card:hover {
  border-color: #007bff;
  transform: translateY(-5px);
}

.usecase-card i {
  font-size: 2.5rem;
  color: #007bff;
  margin-bottom: 15px;
}

.usecase-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.usecase-card p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
}

.security-guidelines {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.guideline-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.guideline-item i {
  font-size: 1.3rem;
  color: #ffc107;
  margin-top: 5px;
  flex-shrink: 0;
}

.guideline-item h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1rem;
}

.guideline-item p {
  margin: 0;
  color: #555;
  font-size: 0.9rem;
}

.limitation-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.limitation-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: #fff3cd;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.limitation-item i {
  font-size: 1.3rem;
  color: #856404;
  margin-top: 5px;
}

.limitation-item h4 {
  margin: 0 0 5px 0;
  color: #856404;
  font-size: 1rem;
}

.limitation-item p {
  margin: 0;
  color: #856404;
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

  .feature-grid,
  .usecase-grid {
    grid-template-columns: 1fr;
  }

  .access-types {
    grid-template-columns: 1fr;
  }

  .access-card {
    flex-direction: column;
    text-align: center;
  }

  .step-card {
    flex-direction: column;
    text-align: center;
  }

  .security-guidelines {
    grid-template-columns: 1fr;
  }

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>