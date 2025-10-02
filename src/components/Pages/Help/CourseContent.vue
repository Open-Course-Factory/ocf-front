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
        Retour au Centre d'Aide
      </router-link>
    </div>

    <div class="article-header">
      <h1><i class="fas fa-edit"></i> Création de Contenu</h1>
      <p class="article-description">
        Guide pour rédiger et structurer efficacement le contenu pédagogique
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-file-alt"></i> Types de contenu</h2>
        <p>
          OCF prend en charge différents types de contenus pédagogiques
          pour s'adapter à vos méthodes d'enseignement et aux besoins d'apprentissage.
        </p>

        <div class="content-types-grid">
          <div class="content-type-card">
            <i class="fas fa-book-reader"></i>
            <h4>Leçons théoriques</h4>
            <p>
              Contenu explicatif avec texte, images et diagrammes.
              Idéal pour présenter les concepts et notions fondamentales.
            </p>
            <div class="features">
              <span class="feature-tag">📝 Texte enrichi</span>
              <span class="feature-tag">🖼️ Images</span>
              <span class="feature-tag">📊 Diagrammes</span>
            </div>
          </div>

          <div class="content-type-card">
            <i class="fas fa-laptop-code"></i>
            <h4>Exercices pratiques</h4>
            <p>
              Activités hands-on avec instructions et ressources.
              Permet aux apprenants de mettre en pratique les connaissances.
            </p>
            <div class="features">
              <span class="feature-tag">⚡ Interactif</span>
              <span class="feature-tag">🎯 Guidé</span>
              <span class="feature-tag">💻 Terminal</span>
            </div>
          </div>

          <div class="content-type-card">
            <i class="fas fa-clipboard-check"></i>
            <h4>Évaluations</h4>
            <p>
              Tests de connaissances et évaluations de compétences.
              Mesure la progression et valide les acquis.
            </p>
            <div class="features">
              <span class="feature-tag">✅ QCM</span>
              <span class="feature-tag">📝 Questions ouvertes</span>
              <span class="feature-tag">📊 Scoring</span>
            </div>
          </div>

          <div class="content-type-card">
            <i class="fas fa-link"></i>
            <h4>Ressources</h4>
            <p>
              Liens, documents et références complémentaires.
              Enrichit l'apprentissage avec du contenu externe.
            </p>
            <div class="features">
              <span class="feature-tag">🔗 Liens</span>
              <span class="feature-tag">📄 Documents</span>
              <span class="feature-tag">🎥 Médias</span>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-tools"></i> Outils de création</h2>
        <p>
          La plateforme met à votre disposition plusieurs outils pour créer
          du contenu riche et engageant.
        </p>

        <div class="tools-overview">
          <div class="tool-card">
            <div class="tool-icon">
              <i class="fas fa-pen-fancy"></i>
            </div>
            <div class="tool-content">
              <h4>Éditeur de texte enrichi</h4>
              <p>
                Interface WYSIWYG pour la mise en forme du contenu textuel.
                Supports formatage, listes, liens et insertion de médias.
              </p>
              <div class="tool-features">
                <ul>
                  <li>Formatage du texte (gras, italique, couleurs)</li>
                  <li>Listes à puces et numérotées</li>
                  <li>Insertion d'images et de liens</li>
                  <li>Blocs de code avec coloration syntaxique</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="tool-card">
            <div class="tool-icon">
              <i class="fas fa-terminal"></i>
            </div>
            <div class="tool-content">
              <h4>Intégration terminal</h4>
              <p>
                Liaison directe avec les sessions terminal pour les exercices pratiques.
                Permet aux apprenants de pratiquer dans un environnement réel.
              </p>
              <div class="tool-features">
                <ul>
                  <li>Accès direct aux terminaux depuis les pages</li>
                  <li>Exercices guidés step-by-step</li>
                  <li>Validation automatique des commandes</li>
                  <li>Environnements préconfigurés</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="tool-card coming-soon">
            <div class="tool-icon">
              <i class="fas fa-puzzle-piece"></i>
            </div>
            <div class="tool-content">
              <h4>Modules interactifs</h4>
              <p>
                Création de contenus interactifs avancés avec widgets,
                simulations et éléments gamifiés.
              </p>
              <div class="tool-features">
                <span class="coming-soon-badge">Bientôt disponible</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-graduation-cap"></i> Principes pédagogiques</h2>
        <p>
          Appliquez ces principes pour créer du contenu pédagogiquement efficace :
        </p>

        <div class="principles-list">
          <div class="principle-item">
            <div class="principle-icon">
              <i class="fas fa-target"></i>
            </div>
            <div class="principle-content">
              <h4>Objectifs d'apprentissage clairs</h4>
              <p>
                Définissez explicitement ce que l'apprenant sera capable de faire
                après avoir terminé chaque page ou section.
              </p>
              <div class="example-box">
                <strong>Exemple :</strong> "À la fin de cette leçon, vous saurez créer
                et manipuler des variables en Python."
              </div>
            </div>
          </div>

          <div class="principle-item">
            <div class="principle-icon">
              <i class="fas fa-layer-group"></i>
            </div>
            <div class="principle-content">
              <h4>Progression graduelle</h4>
              <p>
                Introduisez les concepts de manière progressive, en vous appuyant
                sur les connaissances précédemment acquises.
              </p>
              <div class="example-box">
                <strong>Exemple :</strong> Variables → Types → Opérations → Fonctions
              </div>
            </div>
          </div>

          <div class="principle-item">
            <div class="principle-icon">
              <i class="fas fa-hands-helping"></i>
            </div>
            <div class="principle-content">
              <h4>Apprentissage actif</h4>
              <p>
                Alternez théorie et pratique. Proposez des exercices réguliers
                pour ancrer les connaissances.
              </p>
              <div class="example-box">
                <strong>Ratio recommandé :</strong> 30% théorie, 70% pratique
              </div>
            </div>
          </div>

          <div class="principle-item">
            <div class="principle-icon">
              <i class="fas fa-comments"></i>
            </div>
            <div class="principle-content">
              <h4>Feedback immédiat</h4>
              <p>
                Fournissez des retours rapides sur les exercices et évaluations
                pour maintenir l'engagement.
              </p>
              <div class="example-box">
                <strong>Méthodes :</strong> Corrections automatiques, explications détaillées
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-lightbulb"></i> Conseils de rédaction</h2>
        <p>
          Optimisez la qualité et l'efficacité de vos contenus avec ces recommandations :
        </p>

        <div class="writing-tips">
          <div class="tip-category">
            <h4><i class="fas fa-language"></i> Langage et style</h4>
            <ul>
              <li>Utilisez un langage clair et accessible</li>
              <li>Évitez le jargon technique sans explication</li>
              <li>Privilégiez les phrases courtes et directes</li>
              <li>Adoptez un ton bienveillant et encourageant</li>
            </ul>
          </div>

          <div class="tip-category">
            <h4><i class="fas fa-eye"></i> Structure visuelle</h4>
            <ul>
              <li>Utilisez des titres et sous-titres explicites</li>
              <li>Aérez le texte avec des paragraphes courts</li>
              <li>Mettez en évidence les points importants</li>
              <li>Ajoutez des éléments visuels (images, schémas)</li>
            </ul>
          </div>

          <div class="tip-category">
            <h4><i class="fas fa-check-circle"></i> Validation et exemples</h4>
            <ul>
              <li>Illustrez chaque concept par des exemples concrets</li>
              <li>Proposez des cas d'usage réels</li>
              <li>Incluez des contre-exemples pour éviter les erreurs</li>
              <li>Testez vos exercices avant publication</li>
            </ul>
          </div>

          <div class="tip-category">
            <h4><i class="fas fa-users"></i> Adaptation au public</h4>
            <ul>
              <li>Adaptez le niveau de détail au public cible</li>
              <li>Proposez des parcours différenciés si nécessaire</li>
              <li>Incluez des prérequis clairement définis</li>
              <li>Anticipez les difficultés courantes</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="help-section workflow">
        <h2><i class="fas fa-project-diagram"></i> Workflow de création</h2>
        <p>
          Suivez ce processus pour créer du contenu de qualité de manière efficace :
        </p>

        <div class="workflow-steps">
          <div class="workflow-step">
            <div class="step-icon">1</div>
            <h4>Planification</h4>
            <p>Définissez les objectifs, le public cible et la structure générale</p>
          </div>

          <div class="workflow-arrow">→</div>

          <div class="workflow-step">
            <div class="step-icon">2</div>
            <h4>Rédaction</h4>
            <p>Créez le contenu en suivant les principes pédagogiques</p>
          </div>

          <div class="workflow-arrow">→</div>

          <div class="workflow-step">
            <div class="step-icon">3</div>
            <h4>Révision</h4>
            <p>Relisez, corrigez et optimisez le contenu</p>
          </div>

          <div class="workflow-arrow">→</div>

          <div class="workflow-step">
            <div class="step-icon">4</div>
            <h4>Test</h4>
            <p>Testez les exercices et validez la cohérence</p>
          </div>

          <div class="workflow-arrow">→</div>

          <div class="workflow-step">
            <div class="step-icon">5</div>
            <h4>Publication</h4>
            <p>Publiez et collectez les retours pour amélioration</p>
          </div>
        </div>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-rocket"></i> Fonctionnalités à venir</h2>
        <div class="upcoming-features">
          <p>
            Les outils de création de contenu sont en développement actif.
            Voici un aperçu des fonctionnalités prévues :
          </p>

          <div class="features-timeline">
            <div class="timeline-item">
              <div class="timeline-dot soon"></div>
              <div class="timeline-content">
                <h4>Prochainement</h4>
                <ul>
                  <li>Templates de pages prédéfinis</li>
                  <li>Bibliothèque de ressources partagées</li>
                  <li>Éditeur markdown avancé</li>
                </ul>
              </div>
            </div>

            <div class="timeline-item">
              <div class="timeline-dot future"></div>
              <div class="timeline-content">
                <h4>En développement</h4>
                <ul>
                  <li>Système de versions et collaboration</li>
                  <li>Analytics et métriques d'engagement</li>
                  <li>Import/export de contenus</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> Ressources utiles</h2>
        <div class="resources-grid">
          <router-link :to="`${helpRoutePrefix}/courses/structure`" class="resource-card">
            <i class="fas fa-sitemap"></i>
            <h4>Structure des cours</h4>
            <p>Comprendre l'organisation hiérarchique des contenus</p>
          </router-link>

          <router-link to="/pages" class="resource-card">
            <i class="fas fa-file-alt"></i>
            <h4>Gestion des pages</h4>
            <p>Accéder à l'interface de création et d'édition</p>
          </router-link>

          <div class="resource-card disabled">
            <i class="fas fa-book-open"></i>
            <h4>Guide avancé (Bientôt)</h4>
            <p>Techniques avancées de création de contenu</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Determine the correct help routes based on current path
const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')
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

.help-section.workflow {
  background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
  border-left: 4px solid #28a745;
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

.help-section.workflow h2 i {
  color: #28a745;
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

.content-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.content-type-card {
  text-align: center;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.content-type-card:hover {
  border-color: #007bff;
  transform: translateY(-5px);
}

.content-type-card i {
  font-size: 2.5rem;
  color: #007bff;
  margin-bottom: 15px;
}

.content-type-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.content-type-card p {
  margin: 0 0 15px 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.feature-tag {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #495057;
  border: 1px solid #dee2e6;
}

.tools-overview {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 25px 0;
}

.tool-card {
  display: flex;
  gap: 20px;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.tool-card:hover:not(.coming-soon) {
  border-color: #007bff;
  transform: translateY(-2px);
}

.tool-card.coming-soon {
  opacity: 0.7;
  position: relative;
}

.tool-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  background: #007bff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.tool-card.coming-soon .tool-icon {
  background: #6c757d;
}

.tool-content {
  flex-grow: 1;
}

.tool-content h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.2rem;
}

.tool-content p {
  margin: 0 0 15px 0;
  color: #555;
  font-size: 0.9rem;
}

.tool-features ul {
  margin: 0;
  padding-left: 20px;
  color: #555;
}

.tool-features li {
  margin-bottom: 5px;
  font-size: 0.85rem;
}

.coming-soon-badge {
  background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.principles-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin: 25px 0;
}

.principle-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.principle-icon {
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

.principle-content {
  flex-grow: 1;
}

.principle-content h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.principle-content p {
  margin: 0 0 12px 0;
  color: #555;
  font-size: 0.9rem;
}

.example-box {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: #856404;
}

.writing-tips {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 25px 0;
}

.tip-category {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.tip-category h4 {
  margin: 0 0 15px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-category h4 i {
  color: #007bff;
}

.tip-category ul {
  margin: 0;
  padding-left: 20px;
  color: #555;
}

.tip-category li {
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.workflow-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 25px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
}

.workflow-step {
  text-align: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 2px solid #28a745;
  min-width: 120px;
}

.step-icon {
  width: 40px;
  height: 40px;
  background: #28a745;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin: 0 auto 10px auto;
}

.workflow-step h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 0.9rem;
}

.workflow-step p {
  margin: 0;
  color: #6c757d;
  font-size: 0.8rem;
}

.workflow-arrow {
  color: #28a745;
  font-size: 1.5rem;
  font-weight: bold;
}

.upcoming-features {
  background: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.features-timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.timeline-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.timeline-dot.soon {
  background: #ffc107;
}

.timeline-dot.future {
  background: #6c757d;
}

.timeline-content h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1rem;
}

.timeline-content ul {
  margin: 0;
  padding-left: 20px;
  color: #555;
}

.timeline-content li {
  margin-bottom: 5px;
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

.resource-card:hover:not(.disabled) {
  border-color: #007bff;
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.resource-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.resource-card i {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 15px;
}

.resource-card.disabled i {
  color: #6c757d;
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

  .content-types-grid,
  .writing-tips {
    grid-template-columns: 1fr;
  }

  .tool-card {
    flex-direction: column;
    text-align: center;
  }

  .principle-item {
    flex-direction: column;
    text-align: center;
  }

  .workflow-steps {
    flex-direction: column;
  }

  .workflow-arrow {
    transform: rotate(90deg);
  }

  .resources-grid {
    grid-template-columns: 1fr;
  }
}
</style>