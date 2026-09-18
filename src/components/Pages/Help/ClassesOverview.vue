<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
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
      <h1><i class="fas fa-chalkboard-teacher"></i> {{ t('helpClasses.overview.title') }}</h1>
      <p class="article-description">{{ t('helpClasses.overview.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-info-circle"></i> {{ t('helpClasses.overview.what.title') }}</h2>
        <p>{{ t('helpClasses.overview.what.p1') }}</p>
        <ul>
          <li v-html="t('helpClasses.overview.what.owner')"></li>
          <li v-html="t('helpClasses.overview.what.managers')"></li>
          <li v-html="t('helpClasses.overview.what.members')"></li>
        </ul>
        <p>{{ t('helpClasses.overview.what.p2') }}</p>
      </section>

      <section class="help-section info">
        <h2><i class="fas fa-building"></i> {{ t('helpClasses.overview.where.title') }}</h2>
        <p>{{ t('helpClasses.overview.where.p1') }}</p>
        <p>{{ t('helpClasses.overview.where.p2') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-th-list"></i> {{ t('helpClasses.overview.console.title') }}</h2>
        <p>{{ t('helpClasses.overview.console.p1') }}</p>
        <HelpScreenshot name="my-classes" :caption="t('helpClasses.overview.console.caption')" />
        <ul>
          <li v-html="t('helpClasses.overview.console.row1')"></li>
          <li v-html="t('helpClasses.overview.console.row2')"></li>
          <li v-html="t('helpClasses.overview.console.row3')"></li>
          <li v-html="t('helpClasses.overview.console.row4')"></li>
        </ul>
        <p>{{ t('helpClasses.overview.console.p2') }}</p>
        <router-link v-if="!isPublicHelp" to="/my-classes" class="btn btn-outline">
          <i class="fas fa-chalkboard-teacher"></i>
          {{ t('helpClasses.overview.console.button') }}
        </router-link>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-plus-circle"></i> {{ t('helpClasses.overview.create.title') }}</h2>
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.overview.create.step1.title') }}</h4>
            <p>{{ t('helpClasses.overview.create.step1.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.overview.create.step2.title') }}</h4>
            <ul>
              <li v-html="t('helpClasses.overview.create.step2.name')"></li>
              <li v-html="t('helpClasses.overview.create.step2.organization')"></li>
              <li v-html="t('helpClasses.overview.create.step2.parent')"></li>
              <li v-html="t('helpClasses.overview.create.step2.max')"></li>
              <li v-html="t('helpClasses.overview.create.step2.expires')"></li>
            </ul>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.overview.create.step3.title') }}</h4>
            <p>{{ t('helpClasses.overview.create.step3.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-columns"></i> {{ t('helpClasses.overview.pages.title') }}</h2>
        <p>{{ t('helpClasses.overview.pages.p1') }}</p>
        <ul>
          <li v-html="t('helpClasses.overview.pages.live')"></li>
          <li v-html="t('helpClasses.overview.pages.members')"></li>
          <li v-html="t('helpClasses.overview.pages.scenarios')"></li>
          <li v-html="t('helpClasses.overview.pages.analytics')"></li>
          <li v-html="t('helpClasses.overview.pages.settings')"></li>
        </ul>
        <p>{{ t('helpClasses.overview.pages.p2') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/classes/members`" class="next-step-card">
            <i class="fas fa-user-plus"></i>
            <h4>{{ t('helpClasses.overview.next.members.title') }}</h4>
            <p>{{ t('helpClasses.overview.next.members.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/classes/scenarios`" class="next-step-card">
            <i class="fas fa-clipboard-list"></i>
            <h4>{{ t('helpClasses.overview.next.scenarios.title') }}</h4>
            <p>{{ t('helpClasses.overview.next.scenarios.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/organizations/overview`" class="next-step-card">
            <i class="fas fa-building"></i>
            <h4>{{ t('helpClasses.overview.next.organizations.title') }}</h4>
            <p>{{ t('helpClasses.overview.next.organizations.description') }}</p>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTranslations } from '../../../composables/useTranslations'
import { useHelpTranslations } from '../../../composables/useHelpTranslations'
import HelpScreenshot from './HelpScreenshot.vue'

// `help.navigation.*` lives in the shared help locale files; the article itself
// is translated inline below.
const { loadHelpTranslations } = useHelpTranslations()
const route = useRoute()

const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

const { t } = useTranslations({
  en: {
    helpClasses: {
      overview: {
        title: 'What a class is',
        intro: 'A class is the place where you teach on OCF: your learners, the scenarios you give them and everything you see of their work, on five pages that share one banner.',
        what: {
          title: 'A group of learners, a trainer, scenarios',
          p1: 'A class is a group inside a team organization. It has:',
          owner: '<strong>an owner</strong> — the trainer who created it. Only the owner (or a platform administrator) can delete it or hand over the owner role;',
          managers: '<strong>managers</strong>, optionally — colleagues or assistants who see the same five pages as the owner and can add learners, assign scenarios and supervise;',
          members: '<strong>members</strong> — the learners. They are the ones a scenario is started for, the ones counted as "connected", the ones whose results you read.',
          p2: 'Scenarios are assigned to the class as a whole. Each learner works in their own terminal; you follow all of them from one screen.'
        },
        where: {
          title: 'Classes live in a team organization',
          p1: 'Your personal space carries your plan, not your classes. To open a class you need a team organization — create one from Organizations — and a plan that covers teaching (Formateur, or a School / training-organization plan). On a plan that does not, "My classes" offers the upgrade instead of a creation form.',
          p2: 'The console shows the classes of the organization you are currently working in. If a class seems missing, switch organization from the menu under your name, top right.'
        },
        console: {
          title: 'The "My classes" console',
          p1: 'Everything you teach, one row per class, refreshed every 30 seconds while the page is open:',
          caption: 'The "My classes" console: one row per class — learners connected, assigned scenarios and their completion, and the buttons to step in.',
          row1: '<strong>Who is there</strong> — how many learners are connected right now out of the class total, and how many have made no progress for a while (they may be stuck rather than away).',
          row2: '<strong>What is assigned</strong> — one line per assigned scenario with how many learners have finished it.',
          row3: '<strong>Where to step in</strong> — "Open the wall" opens the live terminals of the class; the icons next to it jump to Learners, Scenarios and Settings.',
          row4: '<strong>Search and filters</strong> — "Active" hides archived classes in a fold at the bottom of the page; "All" lists them inline.',
          p2: 'Classes with someone connected are listed first, so the one that may need you is never below the fold.',
          button: 'Open My classes'
        },
        create: {
          title: 'Creating a class',
          step1: {
            title: 'Click "New class"',
            description: 'Top right of "My classes". The button is there as soon as you work in a team organization whose plan covers teaching.'
          },
          step2: {
            title: 'Fill in the form',
            name: '<strong>Display name</strong> (required) and a description. The URL slug is generated from the name.',
            organization: '<strong>Organization</strong> — only organizations able to hold classes are listed.',
            parent: '<strong>Parent group</strong> — leave empty for a class; pick a group to create a sub-group of it (see Settings and archiving).',
            max: '<strong>Maximum members</strong> (required) — the class refuses new members beyond it.',
            expires: '<strong>Expiration date</strong> — optional; an expired class is flagged in the console.'
          },
          step3: {
            title: 'Bring learners in and assign a scenario',
            description: 'The new class appears in the console. It is empty: the next two guides cover adding learners and assigning scenarios.'
          }
        },
        pages: {
          title: 'The five pages of a class',
          p1: 'Opening a class shows a banner with its name, "x/y connected", and five pages:',
          live: '<strong>Live</strong> — progress per learner on the watched scenario, and the wall of terminals.',
          members: '<strong>Learners</strong> — the roster: add, remove, change roles, regenerate passwords.',
          scenarios: '<strong>Scenarios</strong> — what is assigned, start for all, results.',
          analytics: '<strong>Analytics</strong> — figures per scenario, CSV export, command replay.',
          settings: '<strong>Settings</strong> — name, size, sub-groups, archiving.',
          p2: 'Learners who open the class only see the Learners page. The other four are for the owner and the managers.'
        },
        next: {
          members: { title: 'Adding learners', description: 'One by one, or by CSV import.' },
          scenarios: { title: 'Assigning scenarios', description: 'Dates, start for all, what learners see.' },
          organizations: { title: 'Organizations', description: 'Personal vs team, members and roles, plans.' }
        }
      }
    }
  },
  fr: {
    helpClasses: {
      overview: {
        title: 'Qu\'est-ce qu\'une classe ?',
        intro: 'La classe est l\'endroit où vous enseignez sur OCF : vos apprenants, les scénarios que vous leur donnez et tout ce que vous voyez de leur travail, sur cinq pages qui partagent un même bandeau.',
        what: {
          title: 'Des apprenants, un formateur, des scénarios',
          p1: 'Une classe est un groupe au sein d\'une organisation d\'équipe. Elle a :',
          owner: '<strong>un propriétaire</strong> — le formateur qui l\'a créée. Lui seul (ou un administrateur de la plateforme) peut la supprimer ou céder le rôle de propriétaire ;',
          managers: '<strong>des gestionnaires</strong>, éventuellement — collègues ou assistants qui voient les mêmes cinq pages que le propriétaire et peuvent ajouter des apprenants, assigner des scénarios et superviser ;',
          members: '<strong>des membres</strong> — les apprenants. Ce sont eux pour qui un scénario est lancé, eux qui sont comptés comme « connectés », eux dont vous lisez les résultats.',
          p2: 'Les scénarios sont assignés à la classe entière. Chaque apprenant travaille dans son propre terminal ; vous les suivez tous depuis un seul écran.'
        },
        where: {
          title: 'Les classes vivent dans une organisation d\'équipe',
          p1: 'Votre espace personnel porte votre forfait, pas vos classes. Pour ouvrir une classe, il vous faut une organisation d\'équipe — créez-la depuis Organisations — et un forfait qui couvre l\'enseignement (Formateur, ou un forfait École / Organisme de formation). Avec un forfait qui ne le couvre pas, « Mes classes » propose la mise à niveau à la place du formulaire de création.',
          p2: 'La console affiche les classes de l\'organisation dans laquelle vous travaillez en ce moment. Si une classe semble manquer, changez d\'organisation depuis le menu sous votre nom, en haut à droite.'
        },
        console: {
          title: 'La console « Mes classes »',
          p1: 'Tout ce que vous enseignez, une ligne par classe, actualisée toutes les 30 secondes tant que la page est ouverte :',
          caption: 'La console « Mes classes » : une ligne par classe — apprenants connectés, scénarios assignés et leur avancement, et les boutons pour intervenir.',
          row1: '<strong>Qui est là</strong> — combien d\'apprenants sont connectés en ce moment sur le total de la classe, et combien n\'ont pas progressé depuis un moment (ils bloquent peut-être, plutôt qu\'ils ne sont partis).',
          row2: '<strong>Ce qui est assigné</strong> — une ligne par scénario assigné, avec le nombre d\'apprenants qui l\'ont terminé.',
          row3: '<strong>Où intervenir</strong> — « Ouvrir le mur » ouvre les terminaux en direct de la classe ; les icônes à côté mènent aux pages Apprenants, Scénarios et Réglages.',
          row4: '<strong>Recherche et filtres</strong> — « Actives » replie les classes archivées en bas de page ; « Toutes » les liste avec les autres.',
          p2: 'Les classes où quelqu\'un est connecté passent en tête : celle qui a peut-être besoin de vous n\'est jamais hors de vue.',
          button: 'Ouvrir Mes classes'
        },
        create: {
          title: 'Créer une classe',
          step1: {
            title: 'Cliquez sur « Nouvelle classe »',
            description: 'En haut à droite de « Mes classes ». Le bouton est là dès que vous travaillez dans une organisation d\'équipe dont le forfait couvre l\'enseignement.'
          },
          step2: {
            title: 'Remplissez le formulaire',
            name: '<strong>Nom d\'affichage</strong> (obligatoire) et une description. Le slug d\'URL est généré à partir du nom.',
            organization: '<strong>Organisation</strong> — seules les organisations qui peuvent accueillir des classes sont proposées.',
            parent: '<strong>Groupe parent</strong> — laissez vide pour une classe ; choisissez un groupe pour en créer un sous-groupe (voir Réglages et archivage).',
            max: '<strong>Membres maximum</strong> (obligatoire) — au-delà, la classe refuse les nouveaux membres.',
            expires: '<strong>Date d\'expiration</strong> — facultative ; une classe expirée est signalée dans la console.'
          },
          step3: {
            title: 'Ajoutez des apprenants et assignez un scénario',
            description: 'La nouvelle classe apparaît dans la console. Elle est vide : les deux guides suivants couvrent l\'ajout des apprenants et l\'assignation des scénarios.'
          }
        },
        pages: {
          title: 'Les cinq pages d\'une classe',
          p1: 'Ouvrir une classe affiche un bandeau avec son nom, « x/y connectés », et cinq pages :',
          live: '<strong>En direct</strong> — la progression de chaque apprenant sur le scénario suivi, et le mur des terminaux.',
          members: '<strong>Apprenants</strong> — l\'effectif : ajouter, retirer, changer les rôles, régénérer des mots de passe.',
          scenarios: '<strong>Scénarios</strong> — ce qui est assigné, le lancement pour tous, les résultats.',
          analytics: '<strong>Analytiques</strong> — les chiffres par scénario, l\'export CSV, la relecture des commandes.',
          settings: '<strong>Réglages</strong> — nom, taille, sous-groupes, archivage.',
          p2: 'Un apprenant qui ouvre la classe ne voit que la page Apprenants. Les quatre autres sont réservées au propriétaire et aux gestionnaires.'
        },
        next: {
          members: { title: 'Ajouter des apprenants', description: 'Un par un, ou par import CSV.' },
          scenarios: { title: 'Assigner des scénarios', description: 'Dates, lancement pour tous, ce que voient les apprenants.' },
          organizations: { title: 'Organisations', description: 'Personnelle ou d\'équipe, membres et rôles, forfaits.' }
        }
      }
    }
  }
})

onMounted(async () => {
  await loadHelpTranslations()
})
</script>

<style scoped>
/* Page-specific styles only - common help article styles are in help-article.css */
</style>
