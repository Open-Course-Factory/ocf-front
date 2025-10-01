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
  <div class="help-page">
    <div class="help-header">
      <h1><i class="fas fa-question-circle"></i> Centre d'Aide</h1>
      <p class="help-description">
        Guides et documentation pour utiliser efficacement la plateforme OCF
      </p>
    </div>

    <div class="help-sections">
      <div class="help-section" v-for="section in helpSections" :key="section.id">
        <div class="section-card" @click="toggleSection(section.id)">
          <div class="section-header">
            <div class="section-title">
              <i :class="section.icon"></i>
              <h3>{{ section.title }}</h3>
            </div>
            <div class="section-toggle">
              <i class="fas fa-chevron-down" :class="{ rotated: expandedSections.has(section.id) }"></i>
            </div>
          </div>
          <p class="section-description">{{ section.description }}</p>
        </div>

        <div v-if="expandedSections.has(section.id)" class="section-content">
          <div class="help-items">
            <router-link
              v-for="item in section.items"
              :key="item.route"
              :to="item.route"
              class="help-item"
            >
              <div class="item-icon">
                <i :class="item.icon"></i>
              </div>
              <div class="item-content">
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
              </div>
              <div class="item-arrow">
                <i class="fas fa-arrow-right"></i>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="help-footer">
      <div class="contact-support">
        <h3><i class="fas fa-headset"></i> Besoin d'aide supplémentaire ?</h3>
        <p>Si vous ne trouvez pas la réponse à votre question, n'hésitez pas à nous contacter.</p>
        <a href="mailto:contact@labinux.com" class="btn btn-primary">
          <i class="fas fa-envelope"></i>
          Contacter le Support
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const expandedSections = ref(new Set<string>())

const helpSections = [
  {
    id: 'terminals',
    title: 'Système de Terminaux',
    description: 'Guides pour créer, gérer et utiliser les sessions de terminaux',
    icon: 'fas fa-terminal',
    items: [
      {
        route: '/help/terminals/getting-started',
        title: 'Premiers Pas',
        description: 'Configuration initiale et création de votre première session',
        icon: 'fas fa-play-circle'
      },
      {
        route: '/help/terminals/managing-sessions',
        title: 'Gestion des Sessions',
        description: 'Comment gérer, surveiller et contrôler vos sessions actives',
        icon: 'fas fa-cogs'
      },
      {
        route: '/help/terminals/sharing',
        title: 'Partage et Collaboration',
        description: 'Partager vos terminaux et collaborer avec d\'autres utilisateurs',
        icon: 'fas fa-share-alt'
      },
      {
        route: '/help/terminals/troubleshooting',
        title: 'Dépannage',
        description: 'Solutions aux problèmes courants et conseils de dépannage',
        icon: 'fas fa-wrench'
      }
    ]
  },
  {
    id: 'courses',
    title: 'Création de Cours',
    description: 'Guides pour concevoir et organiser vos contenus pédagogiques',
    icon: 'fas fa-graduation-cap',
    items: [
      {
        route: '/help/courses/structure',
        title: 'Structure des Cours',
        description: 'Organisation des cours, chapitres, sections et pages',
        icon: 'fas fa-sitemap'
      },
      {
        route: '/help/courses/content',
        title: 'Création de Contenu',
        description: 'Rédaction et mise en forme du contenu pédagogique',
        icon: 'fas fa-edit'
      }
    ]
  },
  {
    id: 'account',
    title: 'Gestion du Compte',
    description: 'Abonnements, facturation et paramètres de compte',
    icon: 'fas fa-user-cog',
    items: [
      {
        route: '/help/account/subscription',
        title: 'Abonnements',
        description: 'Gérer votre abonnement et suivre votre utilisation',
        icon: 'fas fa-calendar-check'
      },
      {
        route: '/help/account/billing',
        title: 'Facturation',
        description: 'Méthodes de paiement, factures et adresses de facturation',
        icon: 'fas fa-credit-card'
      }
    ]
  }
]

function toggleSection(sectionId: string) {
  if (expandedSections.value.has(sectionId)) {
    expandedSections.value.delete(sectionId)
  } else {
    expandedSections.value.add(sectionId)
  }
}
</script>

<style scoped>
.help-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.help-header {
  text-align: center;
  margin-bottom: 40px;
}

.help-header h1 {
  color: #333;
  font-size: 2.5rem;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.help-header h1 i {
  color: #007bff;
}

.help-description {
  color: #6c757d;
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
}

.help-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 60px;
}

.help-section {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-card {
  padding: 25px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.section-card:hover {
  background-color: #f8f9fa;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.section-title i {
  font-size: 1.5rem;
  color: #007bff;
}

.section-title h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.section-toggle i {
  color: #6c757d;
  transition: transform 0.3s ease;
}

.section-toggle i.rotated {
  transform: rotate(180deg);
}

.section-description {
  color: #6c757d;
  margin: 0;
  font-size: 1rem;
}

.section-content {
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
}

.help-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1px;
}

.help-item {
  display: flex;
  align-items: center;
  padding: 20px 25px;
  text-decoration: none;
  color: inherit;
  background: white;
  transition: all 0.3s ease;
  border-bottom: 1px solid #e9ecef;
}

.help-item:hover {
  background-color: #e3f2fd;
  transform: translateX(5px);
}

.item-icon {
  margin-right: 20px;
  flex-shrink: 0;
}

.item-icon i {
  font-size: 1.3rem;
  color: #007bff;
  width: 30px;
  text-align: center;
}

.item-content {
  flex-grow: 1;
}

.item-content h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.1rem;
}

.item-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.item-arrow {
  margin-left: 15px;
  flex-shrink: 0;
}

.item-arrow i {
  color: #6c757d;
  font-size: 0.9rem;
}

.help-footer {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
}

.contact-support h3 {
  color: #333;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.contact-support h3 i {
  color: #007bff;
}

.contact-support p {
  color: #6c757d;
  margin: 0 0 25px 0;
  font-size: 1.1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 1rem;
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
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .help-page {
    padding: 10px;
  }

  .help-header h1 {
    font-size: 2rem;
    flex-direction: column;
    gap: 10px;
  }

  .help-description {
    font-size: 1rem;
  }

  .section-card {
    padding: 20px;
  }

  .help-items {
    grid-template-columns: 1fr;
  }

  .help-item {
    padding: 15px 20px;
  }

  .item-icon {
    margin-right: 15px;
  }
}
</style>