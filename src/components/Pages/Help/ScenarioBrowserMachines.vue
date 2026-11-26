<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Labinux
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
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
        {{ t('browserMachinesHelp.back') }}
      </router-link>
    </div>

    <div class="article-header">
      <h1><i class="fas fa-laptop"></i> {{ t('browserMachinesHelp.title') }}</h1>
      <p class="article-description">{{ t('browserMachinesHelp.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-user-graduate"></i> {{ t('browserMachinesHelp.learner.title') }}</h2>
        <ul>
          <li v-for="key in ['reload', 'oneTab', 'popout', 'away', 'network', 'browser']" :key="key">
            {{ t(`browserMachinesHelp.learner.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-chalkboard-teacher"></i> {{ t('browserMachinesHelp.trainer.title') }}</h2>
        <ul>
          <li v-for="key in ['setting', 'plan', 'refused', 'noLiveView', 'testCheck']" :key="key">
            {{ t(`browserMachinesHelp.trainer.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section warning">
        <h2><i class="fas fa-exclamation-triangle"></i> {{ t('browserMachinesHelp.caution.title') }}</h2>
        <div class="warning-content">
          <p>{{ t('browserMachinesHelp.caution.owner') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('browserMachinesHelp.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/scenarios/getting-started`" class="next-step-card">
            <i class="fas fa-play-circle"></i>
            <h4>{{ t('browserMachinesHelp.next.gettingStarted.title') }}</h4>
            <p>{{ t('browserMachinesHelp.next.gettingStarted.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/scenarios/creation`" class="next-step-card">
            <i class="fas fa-plus-circle"></i>
            <h4>{{ t('browserMachinesHelp.next.creation.title') }}</h4>
            <p>{{ t('browserMachinesHelp.next.creation.description') }}</p>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTranslations } from '../../../composables/useTranslations'

const route = useRoute()

const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

const { t } = useTranslations({
  en: {
    browserMachinesHelp: {
      back: 'Back to help',
      title: 'Machines in your browser',
      intro: 'Some scenarios run on a Linux machine that starts in your browser tab instead of on a server. You use it as any other: the terminal, the steps, Verify and the hints are the same.',
      learner: {
        title: 'What changes for you',
        reload: 'If you reload or close the tab, the machine is rebuilt at the step you were on. What you did in that step is lost: the page says so, and your browser asks before you leave.',
        oneTab: 'The machine runs in one tab at a time. A second tab on the same scenario tells you it is open elsewhere.',
        popout: 'You can open the terminal in its own window to keep the instructions in view. It is the same shell: keep the scenario\'s page open, the machine lives there.',
        away: 'If the tab stays closed for 15 minutes, the session ends and frees your plan\'s machines. You can resume the scenario later: it is rebuilt at your step.',
        network: 'The machine has no Internet access.',
        browser: 'Use a recent version of Chrome, Edge or Firefox. If your browser cannot start the machine, the terminal says why.'
      },
      trainer: {
        title: 'For trainers',
        setting: 'In the scenario settings, "Where the lab runs" offers: In a container (the default), In the learner\'s browser, or Depends on the learner\'s plan.',
        plan: 'A lab runs in the browser only when the platform and the learner\'s plan allow it. Otherwise it runs in a container, from the same source.',
        refused: 'An exam or a lab with crash traps always runs in a container.',
        noLiveView: 'The live view of the class shows these learners without their terminal: there is no live view of a machine in a browser, and no command history.',
        testCheck: '"Test this check" in the scenario editor works on these labs: the editor runs the preview\'s machine while you test.'
      },
      caution: {
        title: 'Good to know',
        owner: 'In the browser, the learner has the machine in hand: they can read every file in it and fake its checks. Keep graded work in a container.'
      },
      nextSteps: 'Next steps',
      next: {
        gettingStarted: { title: 'Getting started with scenarios', description: 'Launch a scenario, follow its steps and verify your work.' },
        creation: { title: 'Creating scenarios', description: 'The scenario editor, its steps and their scripts.' }
      }
    }
  },
  fr: {
    browserMachinesHelp: {
      back: 'Retour à l\'aide',
      title: 'Les machines dans votre navigateur',
      intro: 'Certains scénarios tournent sur une machine Linux qui démarre dans l\'onglet de votre navigateur, et non sur un serveur. Vous l\'utilisez comme les autres : le terminal, les étapes, "Vérifier" et les indices sont les mêmes.',
      learner: {
        title: 'Ce qui change pour vous',
        reload: 'Si vous rechargez ou fermez l\'onglet, la machine est reconstruite à l\'étape où vous étiez. Ce que vous avez fait dans cette étape est perdu : la page le signale, et votre navigateur vous le demande avant de quitter.',
        oneTab: 'La machine tourne dans un seul onglet à la fois. Un second onglet sur le même scénario vous indique qu\'il est ouvert ailleurs.',
        popout: 'Vous pouvez ouvrir le terminal dans une fenêtre séparée pour garder les consignes sous les yeux. C\'est le même shell : gardez la page du scénario ouverte, la machine s\'y trouve.',
        away: 'Si l\'onglet reste fermé 15 minutes, la session se termine et libère les machines de votre abonnement. Vous pourrez reprendre le scénario plus tard : il est reconstruit à votre étape.',
        network: 'La machine n\'a pas accès à Internet.',
        browser: 'Utilisez une version récente de Chrome, Edge ou Firefox. Si votre navigateur ne peut pas démarrer la machine, le terminal vous dit pourquoi.'
      },
      trainer: {
        title: 'Pour les formateurs',
        setting: 'Dans les paramètres du scénario, "Où le lab s\'exécute" propose : Dans un conteneur (par défaut), Dans le navigateur de l\'apprenant, ou Selon l\'abonnement de l\'apprenant.',
        plan: 'Un lab tourne dans le navigateur seulement si la plateforme et l\'abonnement de l\'apprenant le permettent. Sinon, il tourne dans un conteneur, à partir de la même source.',
        refused: 'Un examen ou un lab à pièges de crash tourne toujours dans un conteneur.',
        noLiveView: 'Le suivi en direct de la classe montre ces apprenants sans leur terminal : une machine dans un navigateur n\'a ni vue en direct, ni historique des commandes.',
        testCheck: '"Tester cette vérification", dans l\'éditeur de scénarios, fonctionne sur ces labs : l\'éditeur fait tourner la machine de l\'aperçu pendant votre test.'
      },
      caution: {
        title: 'À savoir',
        owner: 'Dans le navigateur, l\'apprenant a la machine en main : il peut lire tous ses fichiers et fausser ses vérifications. Gardez les travaux notés dans un conteneur.'
      },
      nextSteps: 'Prochaines étapes',
      next: {
        gettingStarted: { title: 'Premiers pas avec les scénarios', description: 'Lancer un scénario, suivre ses étapes et vérifier votre travail.' },
        creation: { title: 'Création de scénarios', description: 'L\'éditeur de scénarios, ses étapes et leurs scripts.' }
      }
    }
  }
})
</script>
