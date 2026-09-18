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
      <h1><i class="fas fa-clipboard-list"></i> {{ t('helpClasses.scenarios.title') }}</h1>
      <p class="article-description">{{ t('helpClasses.scenarios.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-plus-circle"></i> {{ t('helpClasses.scenarios.assign.title') }}</h2>
        <p>{{ t('helpClasses.scenarios.assign.p1') }}</p>
        <HelpScreenshot name="class-scenarios" :caption="t('helpClasses.scenarios.assign.caption')" />
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.scenarios.assign.step1.title') }}</h4>
            <p v-html="t('helpClasses.scenarios.assign.step1.description')"></p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.scenarios.assign.step2.title') }}</h4>
            <p>{{ t('helpClasses.scenarios.assign.step2.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.scenarios.assign.step3.title') }}</h4>
            <p>{{ t('helpClasses.scenarios.assign.step3.description') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-id-card"></i> {{ t('helpClasses.scenarios.card.title') }}</h2>
        <p>{{ t('helpClasses.scenarios.card.p1') }}</p>
        <ul>
          <li v-html="t('helpClasses.scenarios.card.results')"></li>
          <li v-html="t('helpClasses.scenarios.card.bulkStart')"></li>
          <li v-html="t('helpClasses.scenarios.card.reset')"></li>
          <li v-html="t('helpClasses.scenarios.card.export')"></li>
          <li v-html="t('helpClasses.scenarios.card.remove')"></li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-play"></i> {{ t('helpClasses.scenarios.bulk.title') }}</h2>
        <p>{{ t('helpClasses.scenarios.bulk.p1') }}</p>
        <ul>
          <li>{{ t('helpClasses.scenarios.bulk.learnersOnly') }}</li>
          <li>{{ t('helpClasses.scenarios.bulk.replaces') }}</li>
          <li>{{ t('helpClasses.scenarios.bulk.duration') }}</li>
          <li>{{ t('helpClasses.scenarios.bulk.result') }}</li>
        </ul>
        <div class="help-section warning ocf-help-inset">
          <div class="warning-content">
            <p>{{ t('helpClasses.scenarios.bulk.quota') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-user-graduate"></i> {{ t('helpClasses.scenarios.learner.title') }}</h2>
        <p>{{ t('helpClasses.scenarios.learner.p1') }}</p>
        <HelpScreenshot name="learner-scenarios" :caption="t('helpClasses.scenarios.learner.caption')" />
        <ul>
          <li>{{ t('helpClasses.scenarios.learner.window') }}</li>
          <li>{{ t('helpClasses.scenarios.learner.context') }}</li>
          <li>{{ t('helpClasses.scenarios.learner.resume') }}</li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-file-import"></i> {{ t('helpClasses.scenarios.import.title') }}</h2>
        <p>{{ t('helpClasses.scenarios.import.p1') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/classes/live`" class="next-step-card">
            <i class="fas fa-play"></i>
            <h4>{{ t('helpClasses.scenarios.next.live.title') }}</h4>
            <p>{{ t('helpClasses.scenarios.next.live.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/classes/results`" class="next-step-card">
            <i class="fas fa-chart-bar"></i>
            <h4>{{ t('helpClasses.scenarios.next.results.title') }}</h4>
            <p>{{ t('helpClasses.scenarios.next.results.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/scenarios/creation`" class="next-step-card">
            <i class="fas fa-pen"></i>
            <h4>{{ t('helpClasses.scenarios.next.creation.title') }}</h4>
            <p>{{ t('helpClasses.scenarios.next.creation.description') }}</p>
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
      scenarios: {
        title: 'Assigning scenarios',
        intro: 'A scenario becomes the class\'s work once it is assigned. From the Scenarios page of the class you choose it, frame it in time, start it for everyone and open its results.',
        assign: {
          title: 'Assigning a scenario',
          p1: 'The Scenarios page lists what is assigned; the "Assign a scenario" button adds one.',
          caption: 'The scenarios assigned to a class: difficulty, dates, active state, how many learners finished, and the results button.',
          step1: {
            title: 'Pick the scenario',
            description: 'The list has three sections: the <strong>organization library</strong> (scenarios created in your organization), the <strong>group scenarios</strong> (imported directly into this class) and the <strong>public scenarios</strong> of the platform. A search box filters by title.'
          },
          step2: {
            title: 'Frame it in time (optional)',
            description: 'A start date and a deadline. Both are optional: without them the scenario is available as soon as it is assigned, for as long as it stays assigned.'
          },
          step3: {
            title: 'Assign',
            description: 'The scenario appears in the list with an "Active" badge and, from now on, in the catalogue of every learner of the class.'
          }
        },
        card: {
          title: 'Each assigned scenario',
          p1: 'A card shows the title, the difficulty, the dates, the state, and how far the class has got: "x/y done" with the average grade, or "No attempts yet". Its buttons:',
          results: '<strong>View results</strong> — one line per learner: status, grade, progress, hints used, started and completed dates, and the detail of every step (see Results and analytics).',
          bulkStart: '<strong>Start for all</strong> — opens a session for every learner at once (below).',
          reset: '<strong>Reset sessions</strong> — abandons every active session on this scenario. Learners start over from the first step. Their earlier attempts stay in the results.',
          export: '<strong>Export JSON / Export KillerCoda</strong> — the scenario itself, to reuse it elsewhere.',
          remove: '<strong>Remove</strong> — unassigns the scenario. It leaves the learners\' catalogue and every session still open on it is abandoned; the results stay readable.'
        },
        bulk: {
          title: 'Starting a scenario for the whole class',
          p1: '"Start for all" saves each learner the launch step: every environment is built at once and the learner finds a session ready when they open OCF. On a platform with several terminal backends you choose which one hosts the class.',
          learnersOnly: 'Sessions are started for the learners only — not for the owner nor the managers.',
          replaces: 'A learner who still holds a session on this scenario gets a fresh one: the old session is closed first.',
          duration: 'Each session lasts four hours by default.',
          result: 'The result lists how many sessions were started, and names any learner for whom it failed (no terminal key, quota, environment error).',
          quota: 'Each session started counts against the organization\'s resources like any other terminal: a class of twenty needs room for twenty machines of the size the scenario declares. A learner that could not be started is reported, not silently dropped.'
        },
        learner: {
          title: 'What the learner sees',
          p1: 'On their side, the learner opens Scenarios in the menu. Assigned scenarios sit in their catalogue among the public ones:',
          caption: 'A learner\'s scenario catalogue: scenarios to launch, and one already started with a "Resume" button.',
          window: 'An assigned scenario is visible from its start date to its deadline. Outside that window it leaves the catalogue.',
          context: 'The learner has to be working in the class\'s organization: a scenario assigned in "Lycée Iris" is not listed while they are in their personal space.',
          resume: '"Launch" builds the environment; "Resume" reopens a session already started. A scenario started for the class by the trainer is already in "Resume" state.'
        },
        import: {
          title: 'Importing a scenario into the class',
          p1: '"Import KillerCoda" and "Import JSON" create a scenario from a file and assign it to this class in one step. It then appears under "Group scenarios" when assigning to other classes. Writing scenarios has its own guide (below).'
        },
        next: {
          live: { title: 'Following the class live', description: 'Progress, connections, the wall of terminals.' },
          results: { title: 'Results and analytics', description: 'Per learner, per scenario, CSV exports.' },
          creation: { title: 'Creating scenarios', description: 'The scenario editor, step types, imports.' }
        }
      }
    }
  },
  fr: {
    helpClasses: {
      scenarios: {
        title: 'Assigner des scénarios',
        intro: 'Un scénario devient le travail de la classe une fois assigné. Depuis la page Scénarios de la classe, vous le choisissez, le cadrez dans le temps, le lancez pour tout le monde et ouvrez ses résultats.',
        assign: {
          title: 'Assigner un scénario',
          p1: 'La page Scénarios liste ce qui est assigné ; le bouton « Assigner un scénario » en ajoute un.',
          caption: 'Les scénarios assignés à une classe : difficulté, dates, état actif, nombre d\'apprenants qui ont terminé, et le bouton des résultats.',
          step1: {
            title: 'Choisissez le scénario',
            description: 'La liste a trois sections : la <strong>bibliothèque de l\'organisation</strong> (scénarios créés dans votre organisation), les <strong>scénarios du groupe</strong> (importés directement dans cette classe) et les <strong>scénarios publics</strong> de la plateforme. Un champ de recherche filtre par titre.'
          },
          step2: {
            title: 'Cadrez-le dans le temps (facultatif)',
            description: 'Une date de début et une date limite. Les deux sont facultatives : sans elles, le scénario est disponible dès l\'assignation, tant qu\'elle reste en place.'
          },
          step3: {
            title: 'Assignez',
            description: 'Le scénario apparaît dans la liste avec un badge « Actif » et, désormais, dans le catalogue de chaque apprenant de la classe.'
          }
        },
        card: {
          title: 'Chaque scénario assigné',
          p1: 'Une carte montre le titre, la difficulté, les dates, l\'état, et où en est la classe : « x/y terminés » avec la note moyenne, ou « Aucune tentative ». Ses boutons :',
          results: '<strong>Voir les résultats</strong> — une ligne par apprenant : statut, note, progression, indices utilisés, dates de début et de fin, et le détail de chaque étape (voir Résultats et analytiques).',
          bulkStart: '<strong>Démarrer pour tous</strong> — ouvre une session pour chaque apprenant en une fois (ci-dessous).',
          reset: '<strong>Réinitialiser les sessions</strong> — abandonne toutes les sessions actives sur ce scénario. Les apprenants repartent de la première étape. Leurs tentatives précédentes restent dans les résultats.',
          export: '<strong>Exporter JSON / Exporter KillerCoda</strong> — le scénario lui-même, pour le réutiliser ailleurs.',
          remove: '<strong>Retirer</strong> — désassigne le scénario. Il quitte le catalogue des apprenants et toute session encore ouverte dessus est abandonnée ; les résultats restent lisibles.'
        },
        bulk: {
          title: 'Lancer un scénario pour toute la classe',
          p1: '« Démarrer pour tous » épargne à chaque apprenant l\'étape de lancement : tous les environnements sont construits d\'un coup et l\'apprenant trouve une session prête en ouvrant OCF. Sur une plateforme à plusieurs serveurs de terminaux, vous choisissez lequel héberge la classe.',
          learnersOnly: 'Les sessions sont lancées pour les apprenants seulement — ni pour le propriétaire, ni pour les gestionnaires.',
          replaces: 'Un apprenant qui a encore une session sur ce scénario en reçoit une neuve : l\'ancienne est fermée d\'abord.',
          duration: 'Chaque session dure quatre heures par défaut.',
          result: 'Le résultat indique combien de sessions ont été lancées, et nomme les apprenants pour qui cela a échoué (pas de clé de terminal, quota, erreur d\'environnement).',
          quota: 'Chaque session lancée compte dans les ressources de l\'organisation comme n\'importe quel terminal : une classe de vingt a besoin de place pour vingt machines de la taille que déclare le scénario. Un apprenant qui n\'a pas pu être lancé est signalé, jamais ignoré en silence.'
        },
        learner: {
          title: 'Ce que voit l\'apprenant',
          p1: 'De son côté, l\'apprenant ouvre Scénarios dans le menu. Les scénarios assignés figurent dans son catalogue parmi les scénarios publics :',
          caption: 'Le catalogue de scénarios d\'un apprenant : des scénarios à lancer, et un déjà commencé avec un bouton « Reprendre ».',
          window: 'Un scénario assigné est visible de sa date de début à sa date limite. Hors de cette fenêtre, il quitte le catalogue.',
          context: 'L\'apprenant doit travailler dans l\'organisation de la classe : un scénario assigné dans « Lycée Iris » n\'est pas listé tant qu\'il est dans son espace personnel.',
          resume: '« Lancer » construit l\'environnement ; « Reprendre » rouvre une session déjà commencée. Un scénario lancé pour la classe par le formateur est déjà en état « Reprendre ».'
        },
        import: {
          title: 'Importer un scénario dans la classe',
          p1: '« Importer KillerCoda » et « Importer JSON » créent un scénario à partir d\'un fichier et l\'assignent à cette classe en une étape. Il apparaît ensuite sous « Scénarios du groupe » quand vous assignez à d\'autres classes. L\'écriture des scénarios a son propre guide (ci-dessous).'
        },
        next: {
          live: { title: 'Suivre la classe en direct', description: 'Progression, connexions, le mur des terminaux.' },
          results: { title: 'Résultats et analytiques', description: 'Par apprenant, par scénario, exports CSV.' },
          creation: { title: 'Créer des scénarios', description: 'L\'éditeur de scénarios, les types d\'étapes, les imports.' }
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
</style>
