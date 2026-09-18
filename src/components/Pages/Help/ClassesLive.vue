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
      <h1><i class="fas fa-play"></i> {{ t('helpClasses.live.title') }}</h1>
      <p class="article-description">{{ t('helpClasses.live.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-list-ul"></i> {{ t('helpClasses.live.progress.title') }}</h2>
        <p>{{ t('helpClasses.live.progress.p1') }}</p>
        <HelpScreenshot name="class-live" :caption="t('helpClasses.live.progress.caption')" />
        <ul>
          <li v-html="t('helpClasses.live.progress.header')"></li>
          <li v-html="t('helpClasses.live.progress.chart')"></li>
          <li v-html="t('helpClasses.live.progress.presence')"></li>
          <li v-html="t('helpClasses.live.progress.position')"></li>
          <li v-html="t('helpClasses.live.progress.onStep')"></li>
          <li v-html="t('helpClasses.live.progress.hints')"></li>
          <li v-html="t('helpClasses.live.progress.eye')"></li>
        </ul>
        <p>{{ t('helpClasses.live.progress.noAssignment') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-sort-amount-down"></i> {{ t('helpClasses.live.sort.title') }}</h2>
        <p>{{ t('helpClasses.live.sort.p1') }}</p>
        <ul>
          <li v-html="t('helpClasses.live.sort.step')"></li>
          <li v-html="t('helpClasses.live.sort.hints')"></li>
          <li v-html="t('helpClasses.live.sort.inactivity')"></li>
        </ul>
        <div class="help-section info ocf-help-inset">
          <p>{{ t('helpClasses.live.sort.idleNote') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-th-large"></i> {{ t('helpClasses.live.wall.title') }}</h2>
        <p>{{ t('helpClasses.live.wall.p1') }}</p>
        <HelpScreenshot name="class-wall" :caption="t('helpClasses.live.wall.wallCaption')" />
        <ul>
          <li>{{ t('helpClasses.live.wall.tiles') }}</li>
          <li>{{ t('helpClasses.live.wall.focus') }}</li>
          <li>{{ t('helpClasses.live.wall.reorder') }}</li>
          <li>{{ t('helpClasses.live.wall.remembered') }}</li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-keyboard"></i> {{ t('helpClasses.live.hand.title') }}</h2>
        <p>{{ t('helpClasses.live.hand.p1') }}</p>
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.live.hand.step1.title') }}</h4>
            <p>{{ t('helpClasses.live.hand.step1.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.live.hand.step2.title') }}</h4>
            <p>{{ t('helpClasses.live.hand.step2.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.live.hand.step3.title') }}</h4>
            <p>{{ t('helpClasses.live.hand.step3.description') }}</p>
          </div>
        </div>
        <div class="help-section warning ocf-help-inset">
          <div class="warning-content">
            <p v-html="t('helpClasses.live.hand.shared')"></p>
          </div>
        </div>
        <p>{{ t('helpClasses.live.hand.learnerSide') }}</p>
        <p>{{ t('helpClasses.live.hand.otherTrainer') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-lock"></i> {{ t('helpClasses.live.access.title') }}</h2>
        <p>{{ t('helpClasses.live.access.p1') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/classes/results`" class="next-step-card">
            <i class="fas fa-chart-bar"></i>
            <h4>{{ t('helpClasses.live.next.results.title') }}</h4>
            <p>{{ t('helpClasses.live.next.results.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/classes/scenarios`" class="next-step-card">
            <i class="fas fa-clipboard-list"></i>
            <h4>{{ t('helpClasses.live.next.scenarios.title') }}</h4>
            <p>{{ t('helpClasses.live.next.scenarios.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/terminals/managing-sessions`" class="next-step-card">
            <i class="fas fa-terminal"></i>
            <h4>{{ t('helpClasses.live.next.terminals.title') }}</h4>
            <p>{{ t('helpClasses.live.next.terminals.description') }}</p>
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
      live: {
        title: 'Following the class live',
        intro: 'The Live page answers, during the session, the two questions a trainer keeps asking: where is everyone in the scenario, and who needs me? It has two representations of the same class — the progress table and the wall of terminals — and lets you type in a learner\'s terminal alongside them.',
        progress: {
          title: 'The progress table',
          p1: 'The default view. One row per learner on the watched scenario — pick it in "Watched scenario" when several are assigned:',
          caption: 'The Live page in progress view: who is connected, the distribution per step, and one row per learner with their position.',
          header: '<strong>"x/y connected"</strong>, and for the watched scenario "ends in …" or "deadline passed" when it has a deadline.',
          chart: '<strong>The distribution per step</strong> — a bar per step of the scenario, from "Not started" to "Finished", with the number of learners on each. One glance tells you where the class is.',
          presence: '<strong>Presence</strong> — a green dot for a learner connected to a terminal right now, a red circle otherwise.',
          position: '<strong>Position in the scenario</strong> — a dot per step, and the current one named ("S3 · The Adventure Begins"), or "Not started", or "Finished" with the grade.',
          onStep: '<strong>On the step</strong> — how long the learner has been on their current step.',
          hints: '<strong>Hints</strong> — how many hints they used; highlighted as soon as it is not zero.',
          eye: '<strong>The eye</strong> — opens the wall on that learner\'s terminal. Greyed out when they have no live terminal.',
          noAssignment: 'With no scenario assigned, the table still lists the learners with their presence — enough to see who is there.'
        },
        sort: {
          title: 'Sorting: who to look at first',
          p1: 'Three sort orders, each putting a different kind of learner at the top:',
          step: '<strong>Step</strong> — least advanced first.',
          hints: '<strong>Hints</strong> — most hints used first.',
          inactivity: '<strong>Inactivity</strong> — learners with no progress for the longest time first. The rows to look at.',
          idleNote: 'Inactivity is measured on scenario progress, not on typing: a learner who has been typing for ten minutes without validating a step is "inactive" here. That is precisely the one who may be stuck.'
        },
        wall: {
          title: 'The wall of terminals',
          p1: 'The second representation ("Wall" at the top right, or "Open the wall" from the console): every live terminal of the class as a tile, updating in real time.',
          tiles: 'One tile per learner with an open terminal, named after them.',
          focus: 'Click a tile to focus it: the terminal fills the page and the typing controls appear. "Back to the wall" returns to the tiles.',
          reorder: 'Drag a tile, or focus one and press Ctrl + Left / Right, to arrange the wall like the room.',
          wallCaption: 'The wall: one tile per learner with a live terminal.',
          remembered: 'The representation you left a class on is remembered for that class; the URL keeps it too (?view=wall), so a link to the wall opens on the wall.'
        },
        hand: {
          title: 'Typing in a learner\'s terminal',
          p1: 'Watching is read-only: nothing you type reaches the learner\'s shell until you ask for it.',
          step1: {
            title: 'Focus the learner\'s tile',
            description: 'From the wall, or with the eye button of their row in the progress table.'
          },
          step2: {
            title: 'Click "Type in the terminal"',
            description: 'The tile shows "You are in control" and your keystrokes now go to the learner\'s shell. Show the command, fix the typo, then hand back.'
          },
          step3: {
            title: 'Click "Stop typing"',
            description: 'Your keyboard is disconnected from the terminal again. Leaving the page does the same.'
          },
          shared: '<strong>Control is shared, never taken.</strong> While you type, the learner keeps typing too: their keystrokes and yours land in the same shell. You do not lock them out, so agree on who types — say it out loud in the room, or in the terminal.',
          learnerSide: 'The learner sees it: a chip in their terminal bar reads "A trainer is watching this session" as soon as you open their tile, and "A trainer is typing in your terminal" while you have the hand.',
          otherTrainer: 'When another trainer of the class already has the hand, the tile says so ("Controlled by another trainer"); the observers count on the tile tells how many trainers are watching.'
        },
        access: {
          title: 'Who can supervise',
          p1: 'The owner and the managers of the class. Supervision also depends on the organization\'s plan: on a plan that does not include it, the wall shows "You do not have permission to supervise sessions in this group" instead of the tiles.'
        },
        next: {
          results: { title: 'Results and analytics', description: 'After the session: grades, steps, command replay.' },
          scenarios: { title: 'Assigning scenarios', description: 'Start for all, reset, deadlines.' },
          terminals: { title: 'Managing terminal sessions', description: 'Your own sessions: stop, share, expiry.' }
        }
      }
    }
  },
  fr: {
    helpClasses: {
      live: {
        title: 'Suivre la classe en direct',
        intro: 'La page En direct répond, pendant la séance, aux deux questions que se pose sans cesse un formateur : où en est chacun dans le scénario, et qui a besoin de moi ? Elle a deux représentations de la même classe — le tableau de progression et le mur des terminaux — et vous permet d\'écrire dans le terminal d\'un apprenant à ses côtés.',
        progress: {
          title: 'Le tableau de progression',
          p1: 'La vue par défaut. Une ligne par apprenant sur le scénario suivi — choisissez-le dans « Scénario suivi » quand plusieurs sont assignés :',
          caption: 'La page En direct en vue Progression : qui est connecté, la répartition par étape, et une ligne par apprenant avec sa position.',
          header: '<strong>« x/y connectés »</strong>, et pour le scénario suivi « fin dans … » ou « échéance dépassée » s\'il a une date limite.',
          chart: '<strong>La répartition par étape</strong> — une barre par étape du scénario, de « Non commencé » à « Fini », avec le nombre d\'apprenants sur chacune. Un coup d\'œil suffit pour savoir où en est la classe.',
          presence: '<strong>Présence</strong> — un point vert pour un apprenant connecté à un terminal en ce moment, un cercle rouge sinon.',
          position: '<strong>Position dans le scénario</strong> — un point par étape, et l\'étape en cours nommée (« É3 · The Adventure Begins »), ou « Non commencé », ou « Terminé » avec la note.',
          onStep: '<strong>Sur l\'étape</strong> — depuis combien de temps l\'apprenant est sur son étape actuelle.',
          hints: '<strong>Indices</strong> — combien d\'indices il a utilisés ; mis en évidence dès que ce n\'est pas zéro.',
          eye: '<strong>L\'œil</strong> — ouvre le mur sur le terminal de cet apprenant. Grisé s\'il n\'a pas de terminal en cours.',
          noAssignment: 'Sans scénario assigné, le tableau liste quand même les apprenants avec leur présence — de quoi voir qui est là.'
        },
        sort: {
          title: 'Trier : qui regarder en premier',
          p1: 'Trois ordres de tri, chacun remontant un type d\'apprenant en tête :',
          step: '<strong>Étape</strong> — les moins avancés d\'abord.',
          hints: '<strong>Indices</strong> — ceux qui ont utilisé le plus d\'indices d\'abord.',
          inactivity: '<strong>Inactivité</strong> — ceux qui n\'ont pas progressé depuis le plus longtemps d\'abord. Les lignes à regarder.',
          idleNote: 'L\'inactivité se mesure sur la progression dans le scénario, pas sur la frappe : un apprenant qui tape depuis dix minutes sans valider d\'étape est « inactif » ici. C\'est précisément celui qui bloque peut-être.'
        },
        wall: {
          title: 'Le mur des terminaux',
          p1: 'La seconde représentation (« Mur » en haut à droite, ou « Ouvrir le mur » depuis la console) : chaque terminal en cours de la classe sous forme de tuile, mise à jour en temps réel.',
          tiles: 'Une tuile par apprenant qui a un terminal ouvert, à son nom.',
          focus: 'Cliquez sur une tuile pour l\'agrandir : le terminal remplit la page et les commandes d\'écriture apparaissent. « Retour au mur » revient aux tuiles.',
          reorder: 'Glissez une tuile, ou sélectionnez-la et appuyez sur Ctrl + Gauche / Droite, pour disposer le mur comme la salle.',
          wallCaption: 'Le mur : une tuile par apprenant qui a un terminal en cours.',
          remembered: 'La représentation sur laquelle vous quittez une classe est retenue pour cette classe ; l\'URL la garde aussi (?view=wall), donc un lien vers le mur s\'ouvre sur le mur.'
        },
        hand: {
          title: 'Écrire dans le terminal d\'un apprenant',
          p1: 'Regarder est en lecture seule : rien de ce que vous tapez n\'atteint le shell de l\'apprenant tant que vous ne le demandez pas.',
          step1: {
            title: 'Agrandissez la tuile de l\'apprenant',
            description: 'Depuis le mur, ou avec l\'œil de sa ligne dans le tableau de progression.'
          },
          step2: {
            title: 'Cliquez sur « Écrire dans le terminal »',
            description: 'La tuile affiche « Vous avez le contrôle » et vos frappes vont désormais dans le shell de l\'apprenant. Montrez la commande, corrigez la faute de frappe, puis rendez la main.'
          },
          step3: {
            title: 'Cliquez sur « Arrêter d\'écrire »',
            description: 'Votre clavier est de nouveau déconnecté du terminal. Quitter la page fait la même chose.'
          },
          shared: '<strong>Le contrôle est partagé, jamais pris.</strong> Pendant que vous écrivez, l\'apprenant continue d\'écrire aussi : ses frappes et les vôtres arrivent dans le même shell. Vous ne le bloquez pas, donc mettez-vous d\'accord sur qui tape — à voix haute dans la salle, ou dans le terminal.',
          learnerSide: 'L\'apprenant le voit : une pastille dans la barre de son terminal indique « Un formateur observe cette session » dès que vous ouvrez sa tuile, et « Un formateur écrit dans votre terminal » tant que vous avez la main.',
          otherTrainer: 'Quand un autre formateur de la classe a déjà la main, la tuile le dit (« Sous contrôle d\'un autre formateur ») ; le compteur d\'observateurs sur la tuile indique combien de formateurs regardent.'
        },
        access: {
          title: 'Qui peut superviser',
          p1: 'Le propriétaire et les gestionnaires de la classe. La supervision dépend aussi du forfait de l\'organisation : avec un forfait qui ne l\'inclut pas, le mur affiche « Vous n\'avez pas la permission de superviser les sessions de ce groupe » à la place des tuiles.'
        },
        next: {
          results: { title: 'Résultats et analytiques', description: 'Après la séance : notes, étapes, relecture des commandes.' },
          scenarios: { title: 'Assigner des scénarios', description: 'Lancer pour tous, réinitialiser, dates limites.' },
          terminals: { title: 'Gérer les sessions terminal', description: 'Vos propres sessions : arrêt, partage, expiration.' }
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
