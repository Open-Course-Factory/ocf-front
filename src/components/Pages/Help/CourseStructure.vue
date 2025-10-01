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
      <h1><i class="fas fa-sitemap"></i> Structure des Cours</h1>
      <p class="article-description">
        Comprendre l'organisation hiérarchique des contenus pédagogiques dans OCF
      </p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-layer-group"></i> Hiérarchie des contenus</h2>
        <p>
          OCF utilise une structure hiérarchique à quatre niveaux pour organiser les contenus pédagogiques.
          Cette organisation permet une navigation intuitive et une gestion flexible des cours.
        </p>

        <div class="hierarchy-diagram">
          <div class="level-card level-1">
            <div class="level-icon">
              <i class="fas fa-book"></i>
            </div>
            <div class="level-content">
              <h3>Cours</h3>
              <p>Niveau principal - Un domaine d'apprentissage complet</p>
              <div class="level-examples">
                <span class="example-tag">Programmation Python</span>
                <span class="example-tag">Linux Administration</span>
                <span class="example-tag">Bases de données</span>
              </div>
            </div>
          </div>

          <div class="hierarchy-arrow">
            <i class="fas fa-arrow-down"></i>
          </div>

          <div class="level-card level-2">
            <div class="level-icon">
              <i class="fas fa-book-open"></i>
            </div>
            <div class="level-content">
              <h3>Chapitres</h3>
              <p>Grandes thématiques du cours</p>
              <div class="level-examples">
                <span class="example-tag">Variables et Types</span>
                <span class="example-tag">Fonctions</span>
                <span class="example-tag">Programmation Orientée Objet</span>
              </div>
            </div>
          </div>

          <div class="hierarchy-arrow">
            <i class="fas fa-arrow-down"></i>
          </div>

          <div class="level-card level-3">
            <div class="level-icon">
              <i class="fas fa-stream"></i>
            </div>
            <div class="level-content">
              <h3>Sections</h3>
              <p>Sous-thèmes spécifiques</p>
              <div class="level-examples">
                <span class="example-tag">Déclaration de variables</span>
                <span class="example-tag">Types primitifs</span>
                <span class="example-tag">Conversion de types</span>
              </div>
            </div>
          </div>

          <div class="hierarchy-arrow">
            <i class="fas fa-arrow-down"></i>
          </div>

          <div class="level-card level-4">
            <div class="level-icon">
              <i class="fas fa-file-alt"></i>
            </div>
            <div class="level-content">
              <h3>Pages</h3>
              <p>Contenu pédagogique détaillé</p>
              <div class="level-examples">
                <span class="example-tag">Leçon théorique</span>
                <span class="example-tag">Exercice pratique</span>
                <span class="example-tag">Évaluation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-plus-circle"></i> Création et organisation</h2>
        <p>
          Chaque niveau peut être créé et géré indépendamment, permettant une flexibilité maximale
          dans l'organisation de vos contenus pédagogiques.
        </p>

        <div class="creation-workflow">
          <div class="workflow-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Créer un cours</h4>
              <p>
                Définissez le cadre général de votre enseignement.
                Choisissez un titre explicite et une description claire des objectifs.
              </p>
              <router-link to="/courses" class="btn btn-outline">
                <i class="fas fa-book"></i>
                Gérer les cours
              </router-link>
            </div>
          </div>

          <div class="workflow-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Structurer en chapitres</h4>
              <p>
                Organisez votre cours en grandes thématiques logiques.
                Chaque chapitre représente un module d'apprentissage cohérent.
              </p>
              <router-link to="/chapters" class="btn btn-outline">
                <i class="fas fa-book-open"></i>
                Gérer les chapitres
              </router-link>
            </div>
          </div>

          <div class="workflow-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Détailler en sections</h4>
              <p>
                Découpez chaque chapitre en sections spécifiques.
                Facilitez la navigation et l'assimilation progressive.
              </p>
              <router-link to="/sections" class="btn btn-outline">
                <i class="fas fa-stream"></i>
                Gérer les sections
              </router-link>
            </div>
          </div>

          <div class="workflow-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>Rédiger les pages</h4>
              <p>
                Créez le contenu pédagogique final : leçons, exercices,
                évaluations et ressources complémentaires.
              </p>
              <router-link to="/pages" class="btn btn-outline">
                <i class="fas fa-file-alt"></i>
                Gérer les pages
              </router-link>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-cogs"></i> Bonnes pratiques d'organisation</h2>
        <p>
          Suivez ces recommandations pour créer des cours bien structurés et faciles à naviguer :
        </p>

        <div class="practices-grid">
          <div class="practice-card">
            <i class="fas fa-bullseye"></i>
            <h4>Objectifs clairs</h4>
            <p>
              Définissez des objectifs pédagogiques précis pour chaque niveau.
              Chaque élément doit contribuer à un apprentissage spécifique.
            </p>
          </div>

          <div class="practice-card">
            <i class="fas fa-sort-amount-up"></i>
            <h4>Progression logique</h4>
            <p>
              Organisez le contenu selon une progression pédagogique cohérente.
              Les prérequis doivent être acquis avant les notions avancées.
            </p>
          </div>

          <div class="practice-card">
            <i class="fas fa-balance-scale"></i>
            <h4>Équilibre des contenus</h4>
            <p>
              Maintenez un équilibre entre théorie et pratique.
              Alternez leçons, exercices et évaluations.
            </p>
          </div>

          <div class="practice-card">
            <i class="fas fa-tags"></i>
            <h4>Nomenclature cohérente</h4>
            <p>
              Utilisez une nomenclature claire et cohérente.
              Facilitez la compréhension et la navigation.
            </p>
          </div>
        </div>

        <div class="structuring-tips">
          <h3>Conseils de structuration :</h3>
          <div class="tip-list">
            <div class="tip-item">
              <i class="fas fa-lightbulb"></i>
              <div>
                <h4>Granularité appropriée</h4>
                <p>
                  Évitez les chapitres trop longs ou trop courts.
                  Visez 3-7 sections par chapitre, 3-5 pages par section.
                </p>
              </div>
            </div>

            <div class="tip-item">
              <i class="fas fa-puzzle-piece"></i>
              <div>
                <h4>Modularité</h4>
                <p>
                  Créez des modules autonomes qui peuvent être réutilisés
                  ou réorganisés selon les besoins pédagogiques.
                </p>
              </div>
            </div>

            <div class="tip-item">
              <i class="fas fa-route"></i>
              <div>
                <h4>Parcours multiples</h4>
                <p>
                  Prévoyez différents parcours selon le niveau des apprenants :
                  débutant, intermédiaire, avancé.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-link"></i> Relations et dépendances</h2>
        <p>
          Comprenez comment les différents éléments interagissent entre eux :
        </p>

        <div class="relationships-info">
          <div class="relationship-card">
            <h4><i class="fas fa-sitemap"></i> Hiérarchie stricte</h4>
            <p>
              Chaque élément appartient obligatoirement à son niveau parent.
              Une page ne peut exister sans section, une section sans chapitre, etc.
            </p>
          </div>

          <div class="relationship-card">
            <h4><i class="fas fa-copy"></i> Réutilisation possible</h4>
            <p>
              Les contenus peuvent être référencés dans plusieurs contextes.
              Une même page peut apparaître dans différentes sections si pertinent.
            </p>
          </div>

          <div class="relationship-card">
            <h4><i class="fas fa-share-alt"></i> Partage entre cours</h4>
            <p>
              Certains éléments peuvent être partagés entre différents cours
              pour éviter la duplication de contenu.
            </p>
          </div>
        </div>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-info-circle"></i> Évolution de la structure</h2>
        <div class="evolution-notice">
          <p>
            <strong>Note importante :</strong> La structure et les fonctionnalités de gestion des cours
            sont en constante évolution. De nouvelles options d'organisation, des outils de création
            avancés et des fonctionnalités collaboratives seront régulièrement ajoutés.
          </p>
          <p>
            Cette documentation sera mise à jour en conséquence pour refléter
            les dernières améliorations et bonnes pratiques.
          </p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> Prochaines étapes</h2>
        <div class="next-steps">
          <router-link to="/help/courses/content" class="next-step-card">
            <i class="fas fa-edit"></i>
            <h4>Création de Contenu</h4>
            <p>Apprenez à rédiger et structurer le contenu pédagogique</p>
          </router-link>

          <div class="next-step-card disabled">
            <i class="fas fa-users"></i>
            <h4>Collaboration (Bientôt)</h4>
            <p>Fonctionnalités de travail en équipe sur les cours</p>
          </div>
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

.hierarchy-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.level-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 2px solid;
  width: 100%;
  max-width: 600px;
  transition: all 0.3s ease;
}

.level-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.level-1 { border-color: #dc3545; }
.level-2 { border-color: #fd7e14; }
.level-3 { border-color: #ffc107; }
.level-4 { border-color: #28a745; }

.level-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.level-1 .level-icon { background: #dc3545; }
.level-2 .level-icon { background: #fd7e14; }
.level-3 .level-icon { background: #ffc107; }
.level-4 .level-icon { background: #28a745; }

.level-content {
  flex-grow: 1;
}

.level-content h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.3rem;
}

.level-content p {
  margin: 0 0 12px 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.level-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.example-tag {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #495057;
  border: 1px solid #dee2e6;
}

.hierarchy-arrow {
  color: #6c757d;
  font-size: 1.5rem;
  margin: 5px 0;
}

.creation-workflow {
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

.practices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.practice-card {
  text-align: center;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.practice-card:hover {
  border-color: #007bff;
  transform: translateY(-5px);
}

.practice-card i {
  font-size: 2.5rem;
  color: #007bff;
  margin-bottom: 15px;
}

.practice-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.practice-card p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
}

.structuring-tips {
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

.relationships-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.relationship-card {
  padding: 20px;
  background: #e3f2fd;
  border: 2px solid #2196f3;
  border-radius: 8px;
}

.relationship-card h4 {
  margin: 0 0 10px 0;
  color: #1976d2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.relationship-card p {
  margin: 0;
  color: #333;
  font-size: 0.9rem;
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

.next-step-card:hover:not(.disabled) {
  border-color: #007bff;
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.next-step-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.next-step-card i {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 15px;
}

.next-step-card.disabled i {
  color: #6c757d;
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

  .level-card {
    flex-direction: column;
    text-align: center;
  }

  .workflow-step {
    flex-direction: column;
    text-align: center;
  }

  .practices-grid,
  .relationships-info {
    grid-template-columns: 1fr;
  }

  .next-steps {
    grid-template-columns: 1fr;
  }
}
</style>