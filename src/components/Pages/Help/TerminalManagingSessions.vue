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
      <router-link :to="helpMainRoute" class="back-link">
        <i class="fas fa-arrow-left"></i>
        {{ t('help.navigation.backToHelp') }}
      </router-link>
    </div>

    <div class="article-header">
      <h1><i class="fas fa-cogs"></i> {{ t('help.terminals.managingSessions.title') }}</h1>
      <p class="article-description">
        {{ t('help.terminals.managingSessions.intro') }}
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-list"></i> {{ t('help.terminals.managingSessions.sessionTypes.title') }}</h2>
        <p>
          {{ t('help.terminals.managingSessions.intro') }}
        </p>

        <div class="info-card">
          <h4>Accès rapide</h4>
          <p>Naviguez vers <strong>Travaux Pratiques > Mes Sessions</strong> pour voir toutes vos sessions.</p>
          <router-link to="/terminal-sessions" class="btn btn-primary">
            <i class="fas fa-terminal"></i>
            Voir mes sessions
          </router-link>
        </div>

        <div class="feature-grid">
          <div class="feature-card">
            <i class="fas fa-user"></i>
            <h4>{{ t('help.terminals.managingSessions.sessionTypes.personal.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.sessionTypes.personal.description') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-users"></i>
            <h4>{{ t('help.terminals.managingSessions.sessionTypes.shared.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.sessionTypes.shared.description') }}</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-clock"></i>
            <h4>{{ t('help.terminals.managingSessions.sessionTypes.temporary.title') }}</h4>
            <p>{{ t('help.terminals.managingSessions.sessionTypes.temporary.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-sync-alt"></i> {{ t('help.terminals.managingSessions.synchronization.title') }}</h2>
        <p>
          {{ t('help.terminals.managingSessions.synchronization.description') }}
        </p>

        <div class="feature-grid">
          <div class="feature-card">
            <i class="fas fa-sync"></i>
            <h4>Synchronisation individuelle</h4>
            <p>Cliquez sur le bouton "Sync" d'une session pour mettre à jour son statut spécifiquement.</p>
          </div>

          <div class="feature-card">
            <i class="fas fa-sync-alt"></i>
            <h4>Synchronisation globale</h4>
            <p>Le bouton "Tout synchroniser" met à jour toutes vos sessions en une seule fois.</p>
          </div>

          <div class="feature-card">
            <i class="fas fa-clock"></i>
            <h4>Synchronisation automatique</h4>
            <p>Les sessions se synchronisent automatiquement toutes les 30 secondes.</p>
          </div>
        </div>

        <div class="tip-box">
          <h4><i class="fas fa-lightbulb"></i> Conseil</h4>
          <p>
            Si une session semble inactive mais apparaît encore comme "active",
            utilisez la synchronisation pour obtenir le statut le plus récent.
          </p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-external-link-alt"></i> Accès aux terminaux</h2>
        <p>
          Plusieurs options sont disponibles pour accéder à vos sessions terminal :
        </p>

        <div class="access-methods">
          <div class="method-card">
            <div class="method-icon">
              <i class="fas fa-external-link-alt"></i>
            </div>
            <div class="method-content">
              <h4>Ouvrir dans un nouvel onglet</h4>
              <p>
                Le bouton <strong>"Ouvrir"</strong> lance votre terminal dans une nouvelle fenêtre optimisée,
                idéal pour un travail prolongé.
              </p>
            </div>
          </div>

          <div class="method-card">
            <div class="method-icon">
              <i class="fas fa-eye"></i>
            </div>
            <div class="method-content">
              <h4>Aperçu intégré</h4>
              <p>
                L'<strong>"Aperçu"</strong> affiche le terminal directement dans la page,
                pratique pour des vérifications rapides.
              </p>
            </div>
          </div>

          <div class="method-card">
            <div class="method-icon">
              <i class="fas fa-copy"></i>
            </div>
            <div class="method-content">
              <h4>Copie de lien</h4>
              <p>
                Copiez l'URL du terminal pour y accéder plus tard ou
                l'intégrer dans vos favoris.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-code"></i> Intégration iframe</h2>
        <p>
          Vous pouvez intégrer vos terminaux dans d'autres sites web ou plateformes d'apprentissage :
        </p>

        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>Générer le code iframe</h4>
            <p>
              Cliquez sur le bouton <strong>"iframe"</strong> à côté d'une session active
              pour copier automatiquement le code d'intégration.
            </p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>Personnaliser l'affichage</h4>
            <p>
              Le code iframe par défaut utilise une taille de 100% x 600px.
              Vous pouvez modifier ces dimensions selon vos besoins.
            </p>
          </div>
        </div>

        <div class="code-example">
          <h4>Exemple de code iframe :</h4>
          <pre><code>&lt;iframe src="https://votre-domaine.com/terminal/session123?header=true&footer=false"
        width="100%"
        height="600"
        frameborder="0"
        title="Terminal OCF"&gt;&lt;/iframe&gt;</code></pre>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-stop-circle"></i> Arrêt et nettoyage</h2>
        <p>
          Une gestion appropriée de vos sessions permet d'optimiser les ressources :
        </p>

        <div class="action-grid">
          <div class="action-card danger">
            <i class="fas fa-stop"></i>
            <h4>Arrêter une session</h4>
            <p>
              Utilisez le bouton <strong>"Arrêter"</strong> pour terminer proprement une session active
              quand vous avez fini de travailler.
            </p>
          </div>

          <div class="action-card warning">
            <i class="fas fa-eye-slash"></i>
            <h4>Masquer les sessions inactives</h4>
            <p>
              Le bouton <strong>"Masquer"</strong> sur les sessions expirées ou arrêtées
              les retire de votre liste pour un affichage plus propre.
            </p>
          </div>
        </div>

        <div class="warning-box">
          <h4><i class="fas fa-exclamation-triangle"></i> Important</h4>
          <p>
            <strong>Sauvegardez toujours votre travail</strong> avant d'arrêter une session.
            Une fois arrêtée, vous ne pourrez plus récupérer les fichiers non sauvegardés.
          </p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-chart-line"></i> Surveillance et optimisation</h2>
        <p>
          Suivez ces bonnes pratiques pour une utilisation optimale :
        </p>

        <div class="best-practices">
          <div class="practice-item">
            <i class="fas fa-clock"></i>
            <div>
              <h4>Surveillez les expirations</h4>
              <p>Vérifiez régulièrement les dates d'expiration pour éviter la perte de travail.</p>
            </div>
          </div>

          <div class="practice-item">
            <i class="fas fa-save"></i>
            <div>
              <h4>Sauvegardez fréquemment</h4>
              <p>Téléchargez vos fichiers importants ou utilisez des dépôts Git.</p>
            </div>
          </div>

          <div class="practice-item">
            <i class="fas fa-memory"></i>
            <div>
              <h4>Gérez les ressources</h4>
              <p>N'utilisez que le nombre de sessions nécessaires selon votre abonnement.</p>
            </div>
          </div>

          <div class="practice-item">
            <i class="fas fa-refresh"></i>
            <div>
              <h4>Synchronisez régulièrement</h4>
              <p>Utilisez la synchronisation si vous suspectez des problèmes de statut.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> Prochaines étapes</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/terminals/sharing`" class="next-step-card">
            <i class="fas fa-share-alt"></i>
            <h4>Partage et Collaboration</h4>
            <p>Apprenez à partager vos terminaux avec d'autres utilisateurs</p>
          </router-link>

          <router-link :to="`${helpRoutePrefix}/terminals/troubleshooting`" class="next-step-card">
            <i class="fas fa-wrench"></i>
            <h4>Dépannage</h4>
            <p>Solutions aux problèmes courants de gestion des sessions</p>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useHelpTranslations } from '../../../composables/useHelpTranslations'

const { t } = useI18n()
const { loadHelpTranslations } = useHelpTranslations()
const route = useRoute()

// Determine the correct help routes based on current path
const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

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

.info-card {
  background: #e3f2fd;
  border: 2px solid #2196f3;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.info-card h4 {
  margin: 0 0 10px 0;
  color: #1976d2;
}

.info-card p {
  margin: 0 0 15px 0;
  color: #333;
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

.tip-box {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.tip-box h4 {
  margin: 0 0 10px 0;
  color: #856404;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-box p {
  margin: 0;
  color: #856404;
}

.access-methods {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.method-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.method-icon i {
  font-size: 1.5rem;
  color: #007bff;
  width: 30px;
  text-align: center;
}

.method-content h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.method-content p {
  margin: 0;
  color: #555;
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
  margin: 0;
  color: #555;
}

.code-example {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.code-example h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.code-example pre {
  background: #2d3748;
  color: #e2e8f0;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0;
}

.code-example code {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.action-card {
  padding: 20px;
  border-radius: 8px;
  border: 2px solid;
}

.action-card.danger {
  background: #f8d7da;
  border-color: #dc3545;
}

.action-card.warning {
  background: #fff3cd;
  border-color: #ffc107;
}

.action-card i {
  font-size: 1.5rem;
  margin-bottom: 10px;
  display: block;
}

.action-card.danger i {
  color: #dc3545;
}

.action-card.warning i {
  color: #ffc107;
}

.action-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.action-card p {
  margin: 0;
  color: #555;
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

.best-practices {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.practice-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.practice-item i {
  font-size: 1.3rem;
  color: #007bff;
  margin-top: 5px;
}

.practice-item h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1rem;
}

.practice-item p {
  margin: 0;
  color: #555;
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
  .action-grid {
    grid-template-columns: 1fr;
  }

  .method-card {
    flex-direction: column;
    text-align: center;
  }

  .step-card {
    flex-direction: column;
    text-align: center;
  }

  .practice-item {
    flex-direction: column;
    text-align: center;
  }

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>