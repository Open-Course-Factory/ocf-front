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
      <h1><i class="fas fa-chart-bar"></i> {{ t('helpClasses.results.title') }}</h1>
      <p class="article-description">{{ t('helpClasses.results.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-chart-pie"></i> {{ t('helpClasses.results.analytics.title') }}</h2>
        <p>{{ t('helpClasses.results.analytics.p1') }}</p>
        <HelpScreenshot name="class-analytics" :caption="t('helpClasses.results.analytics.caption')" />
        <ul>
          <li v-html="t('helpClasses.results.analytics.tiles')"></li>
          <li v-html="t('helpClasses.results.analytics.table')"></li>
          <li v-html="t('helpClasses.results.analytics.export')"></li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-user-check"></i> {{ t('helpClasses.results.learners.title') }}</h2>
        <p>{{ t('helpClasses.results.learners.p1') }}</p>
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.results.learners.step1.title') }}</h4>
            <p>{{ t('helpClasses.results.learners.step1.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.results.learners.step2.title') }}</h4>
            <p>{{ t('helpClasses.results.learners.step2.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.results.learners.step3.title') }}</h4>
            <ul>
              <li v-html="t('helpClasses.results.learners.step3.steps')"></li>
              <li v-html="t('helpClasses.results.learners.step3.commands')"></li>
            </ul>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-file-csv"></i> {{ t('helpClasses.results.csv.title') }}</h2>
        <ul>
          <li v-html="t('helpClasses.results.csv.analytics')"></li>
          <li v-html="t('helpClasses.results.csv.results')"></li>
          <li v-html="t('helpClasses.results.csv.commands')"></li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-history"></i> {{ t('helpClasses.results.replay.title') }}</h2>
        <p>{{ t('helpClasses.results.replay.p1') }}</p>
        <ul>
          <li>{{ t('helpClasses.results.replay.search') }}</li>
          <li>{{ t('helpClasses.results.replay.stopped') }}</li>
          <li>{{ t('helpClasses.results.replay.breakdown') }}</li>
        </ul>
        <div class="help-section info ocf-help-inset">
          <p>{{ t('helpClasses.results.replay.notice') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/classes/live`" class="next-step-card">
            <i class="fas fa-play"></i>
            <h4>{{ t('helpClasses.results.next.live.title') }}</h4>
            <p>{{ t('helpClasses.results.next.live.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/classes/settings`" class="next-step-card">
            <i class="fas fa-cog"></i>
            <h4>{{ t('helpClasses.results.next.settings.title') }}</h4>
            <p>{{ t('helpClasses.results.next.settings.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/scenarios/getting-started`" class="next-step-card">
            <i class="fas fa-play-circle"></i>
            <h4>{{ t('helpClasses.results.next.scenarios.title') }}</h4>
            <p>{{ t('helpClasses.results.next.scenarios.description') }}</p>
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

const { loadHelpTranslations } = useHelpTranslations()
const route = useRoute()

const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

const { t } = useTranslations({
  en: {
    helpClasses: {
      results: {
        title: 'Results and analytics',
        intro: 'After the session, two levels of reading: the class figures per scenario on the Analytics page, and each learner\'s work step by step from the Scenarios page. Both export to CSV.',
        analytics: {
          title: 'The Analytics page',
          p1: 'The class at a glance, over every assigned scenario:',
          caption: 'The Analytics page: three totals, one line per scenario, and the folded command replay underneath.',
          tiles: '<strong>Three totals</strong> — sessions started, sessions completed, and the completion rate.',
          table: '<strong>One line per scenario</strong> — difficulty, started, completed, completion rate, average grade and average time. A scenario that could not be loaded is named in a warning rather than silently missing.',
          export: '<strong>"Export CSV"</strong> — this table, one line per scenario. If some scenarios failed to load, the export says so before writing an incomplete file.'
        },
        learners: {
          title: 'Each learner\'s results',
          p1: 'Grades and steps are read per scenario, from the Scenarios page of the class.',
          step1: {
            title: 'Click "View results" on the scenario',
            description: 'One line per learner: status (in progress, completed, abandoned…), grade, progress, hints used, started and completed dates. Tick lines to export a selection.'
          },
          step2: {
            title: 'Open "Details" on a line',
            description: 'The learner\'s session: the grade and the number of correct answers, then two tabs.'
          },
          step3: {
            title: 'Read the two tabs',
            steps: '<strong>Steps</strong> — every step of the scenario with its type (terminal, flag, reading, quiz), its status, the attempts, hints and time it took, and for a quiz the questions with the learner\'s answer against the correct one.',
            commands: '<strong>Commands</strong> — everything the learner typed in the terminal during that session, all at once or step by step ("Per step" shows the commands run while each step was active). Exportable as CSV.'
          }
        },
        csv: {
          title: 'The CSV exports',
          analytics: '<strong>Analytics → Export CSV</strong>: one line per scenario with the class figures.',
          results: '<strong>View results → Export CSV / Export selected / Export this learner</strong>: one line per learner and per step — name, email, status, grade, step, title, type, status, attempts, hints, time, and the quiz questions with each answer marked correct or not. Ready for a spreadsheet or a gradebook.',
          commands: '<strong>Commands</strong>: from a learner\'s session detail (that session), or from the command replay below (the whole class).'
        },
        replay: {
          title: 'The command replay',
          p1: 'At the bottom of the Analytics page, folded by default: every command typed in the terminals of the class, with the learner and the time. It is a forensic tool — for finding out what happened in one session, not for following the class day to day (the Live page is for that).',
          search: 'A search box filters the commands; the table pages through them.',
          stopped: '"Include stopped sessions" widens the list to sessions that are over.',
          breakdown: 'Summary cards (total commands, active learners, sessions, average time) and a per-learner breakdown sit above the table.',
          notice: 'Learners are told: the first time a terminal opens, a notice says that commands are recorded. They can export or delete their own history from their terminal sessions.'
        },
        next: {
          live: { title: 'Following the class live', description: 'During the session rather than after.' },
          settings: { title: 'Settings and archiving', description: 'Closing the class once the results are in.' },
          scenarios: { title: 'Scenarios for learners', description: 'What a session looks like on their side.' }
        }
      }
    }
  },
  fr: {
    helpClasses: {
      results: {
        title: 'Résultats et analytiques',
        intro: 'Après la séance, deux niveaux de lecture : les chiffres de la classe par scénario sur la page Analytiques, et le travail de chaque apprenant étape par étape depuis la page Scénarios. Les deux s\'exportent en CSV.',
        analytics: {
          title: 'La page Analytiques',
          p1: 'La classe d\'un coup d\'œil, sur l\'ensemble des scénarios assignés :',
          caption: 'La page Analytiques : trois totaux, une ligne par scénario, et la relecture des commandes repliée en dessous.',
          tiles: '<strong>Trois totaux</strong> — sessions démarrées, sessions terminées, et le taux de complétion.',
          table: '<strong>Une ligne par scénario</strong> — difficulté, démarrées, terminées, taux de complétion, note moyenne et temps moyen. Un scénario qui n\'a pas pu être chargé est nommé dans un avertissement plutôt qu\'absent en silence.',
          export: '<strong>« Exporter CSV »</strong> — ce tableau, une ligne par scénario. Si des scénarios n\'ont pas pu être chargés, l\'export le dit avant d\'écrire un fichier incomplet.'
        },
        learners: {
          title: 'Les résultats de chaque apprenant',
          p1: 'Les notes et les étapes se lisent par scénario, depuis la page Scénarios de la classe.',
          step1: {
            title: 'Cliquez sur « Voir les résultats » du scénario',
            description: 'Une ligne par apprenant : statut (en cours, terminé, abandonné…), note, progression, indices utilisés, dates de début et de fin. Cochez des lignes pour exporter une sélection.'
          },
          step2: {
            title: 'Ouvrez « Détails » sur une ligne',
            description: 'La session de l\'apprenant : la note et le nombre de bonnes réponses, puis deux onglets.'
          },
          step3: {
            title: 'Lisez les deux onglets',
            steps: '<strong>Étapes</strong> — chaque étape du scénario avec son type (terminal, flag, lecture, quiz), son statut, les tentatives, les indices et le temps passé, et pour un quiz les questions avec la réponse de l\'apprenant face à la bonne.',
            commands: '<strong>Commandes</strong> — tout ce que l\'apprenant a tapé dans le terminal pendant cette session, en bloc ou étape par étape (« Par étape » montre les commandes lancées pendant que chaque étape était active). Exportable en CSV.'
          }
        },
        csv: {
          title: 'Les exports CSV',
          analytics: '<strong>Analytiques → Exporter CSV</strong> : une ligne par scénario avec les chiffres de la classe.',
          results: '<strong>Voir les résultats → Exporter CSV / Exporter la sélection / Exporter cet apprenant</strong> : une ligne par apprenant et par étape — nom, e-mail, statut, note, étape, titre, type, statut, tentatives, indices, temps, et les questions de quiz avec chaque réponse marquée juste ou fausse. Prêt pour un tableur ou un carnet de notes.',
          commands: '<strong>Commandes</strong> : depuis le détail de session d\'un apprenant (cette session), ou depuis la relecture des commandes ci-dessous (toute la classe).'
        },
        replay: {
          title: 'La relecture des commandes',
          p1: 'En bas de la page Analytiques, repliée par défaut : toutes les commandes tapées dans les terminaux de la classe, avec l\'apprenant et l\'heure. C\'est un outil d\'enquête — pour comprendre ce qui s\'est passé dans une session, pas pour suivre la classe au quotidien (la page En direct est là pour ça).',
          search: 'Un champ de recherche filtre les commandes ; le tableau les parcourt page par page.',
          stopped: '« Inclure les sessions arrêtées » élargit la liste aux sessions terminées.',
          breakdown: 'Des cartes de synthèse (total des commandes, apprenants actifs, sessions, temps moyen) et une répartition par apprenant précèdent le tableau.',
          notice: 'Les apprenants sont prévenus : à la première ouverture d\'un terminal, un avis indique que les commandes sont enregistrées. Ils peuvent exporter ou supprimer leur propre historique depuis leurs sessions terminal.'
        },
        next: {
          live: { title: 'Suivre la classe en direct', description: 'Pendant la séance plutôt qu\'après.' },
          settings: { title: 'Réglages et archivage', description: 'Clôturer la classe une fois les résultats relevés.' },
          scenarios: { title: 'Les scénarios côté apprenant', description: 'À quoi ressemble une session de leur côté.' }
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
.ocf-help-inset {
  margin-top: 16px;
  margin-bottom: 0;
}

.ocf-help-inset p {
  margin: 0;
}
</style>
