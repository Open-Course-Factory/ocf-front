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
        {{ t('exposedPortsHelp.back') }}
      </router-link>
    </div>

    <div class="article-header">
      <h1><i class="fas fa-plug"></i> {{ t('exposedPortsHelp.title') }}</h1>
      <p class="article-description">{{ t('exposedPortsHelp.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-check-circle"></i> {{ t('exposedPortsHelp.requirements.title') }}</h2>
        <ul>
          <li v-for="key in ['network', 'plan', 'scenario']" :key="key">
            {{ t(`exposedPortsHelp.requirements.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-share-square"></i> {{ t('exposedPortsHelp.expose.title') }}</h2>
        <div v-for="(key, index) in ['listen', 'open', 'port', 'url']" :key="key" class="step-card">
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-content"><p>{{ t(`exposedPortsHelp.expose.${key}`) }}</p></div>
        </div>
        <HelpScreenshot name="terminal-exposed-port" :caption="t('exposedPortsHelp.expose.shot')" />
      </section>

      <section class="help-section">
        <h2><i class="fas fa-hourglass-half"></i> {{ t('exposedPortsHelp.lifetime.title') }}</h2>
        <ul>
          <li v-for="key in ['ttl', 'session', 'stop', 'several']" :key="key">
            {{ t(`exposedPortsHelp.lifetime.${key}`) }}
          </li>
        </ul>
      </section>

      <section class="help-section warning">
        <h2><i class="fas fa-exclamation-triangle"></i> {{ t('exposedPortsHelp.caution.title') }}</h2>
        <div class="warning-content">
          <ul>
            <li v-for="key in ['public', 'recording']" :key="key">
              {{ t(`exposedPortsHelp.caution.${key}`) }}
            </li>
          </ul>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('exposedPortsHelp.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/terminals/getting-started`" class="next-step-card">
            <i class="fas fa-play-circle"></i>
            <h4>{{ t('exposedPortsHelp.next.gettingStarted.title') }}</h4>
            <p>{{ t('exposedPortsHelp.next.gettingStarted.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/terminals/troubleshooting`" class="next-step-card">
            <i class="fas fa-wrench"></i>
            <h4>{{ t('exposedPortsHelp.next.troubleshooting.title') }}</h4>
            <p>{{ t('exposedPortsHelp.next.troubleshooting.description') }}</p>
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
import HelpScreenshot from './HelpScreenshot.vue'

const route = useRoute()

// Determine the correct help routes based on current path
const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')
const helpRoutePrefix = computed(() => isPublicHelp.value ? '/help-public' : '/help')

const { t } = useTranslations({
  en: {
    exposedPortsHelp: {
      back: 'Back to Help Center',
      nextSteps: 'Next steps',
      title: 'Show your work at a public URL',
      intro: 'A program listening on a port inside your session — a web page, an API, a dashboard — can be published at a public URL for a while, so that you, your trainer or anyone with the link can open it in a browser.',
      requirements: {
        title: 'What you need',
        network: 'A running session started with Internet access on (Advanced options). Without a network interface the Ports chip is locked and says: start a session with internet access to expose a port.',
        plan: 'A plan that includes port exposure. If yours does not, the chip answers "Your plan or this scenario does not allow exposing ports publicly".',
        scenario: 'In a scenario, the chip only appears when the scenario allows public port exposure (an option the trainer sets in the Scenario Editor).'
      },
      expose: {
        title: 'Expose a port',
        listen: 'Start something that listens on a port between 1024 and 65535 in the terminal, for example python3 -m http.server 8080.',
        open: 'Click the Ports chip in the terminal header. The Exposed ports popover opens; the badge on the chip counts the ports already exposed.',
        port: 'Type the port number and click Expose.',
        url: 'A line appears with the port, its public URL, an hourglass with the time left, a copy button and a trash icon. Click the URL to open it, or Copy the URL to share it.',
        shot: 'A running Debian session with port 8080 exposed: the Ports chip in the header, the popover with the public URL, the remaining time, the copy and stop buttons.'
      },
      lifetime: {
        title: 'How long it lasts',
        ttl: 'An exposure lives about one hour (the exact duration depends on your plan); the hourglass counts it down. When it expires the URL stops answering and the line disappears.',
        session: 'It never outlives the session: when the terminal expires, is stopped or destroyed, the URL dies with it.',
        stop: 'The trash icon stops an exposure at once. To publish the port again, expose it again: you get a new URL.',
        several: 'You can expose up to three ports of the same session at once, each at its own URL.'
      },
      caution: {
        title: 'Keep in mind',
        public: 'The URL is public: anyone who has it can open it, with no login. Do not expose anything that shows secrets, and stop the exposure when you are done.',
        recording: 'The commands you type are still recorded, as in any session.'
      },
      next: {
        gettingStarted: { title: 'Getting started with terminals', description: 'Where the Internet access option is, and the rest of the composer.' },
        troubleshooting: { title: 'Terminal troubleshooting', description: 'A locked option, a plan limit, a session that will not start.' }
      }
    }
  },
  fr: {
    exposedPortsHelp: {
      back: 'Retour au Centre d\'Aide',
      nextSteps: 'Prochaines étapes',
      title: 'Montrer votre travail sur une URL publique',
      intro: 'Un programme qui écoute sur un port dans votre session — une page web, une API, un tableau de bord — peut être publié un moment sur une URL publique, pour que vous, votre formateur ou toute personne qui a le lien puisse l\'ouvrir dans un navigateur.',
      requirements: {
        title: 'Ce qu\'il vous faut',
        network: 'Une session en cours démarrée avec l\'accès internet activé (Options avancées). Sans interface réseau, la puce Ports est verrouillée et l\'indique : démarrez une session avec accès internet pour exposer un port.',
        plan: 'Une offre qui inclut l\'exposition de ports. Sinon, la puce répond « Votre forfait ou ce scénario ne permet pas d\'exposer des ports publiquement ».',
        scenario: 'Dans un scénario, la puce n\'apparaît que si le scénario autorise l\'exposition publique de ports (une option que le formateur règle dans l\'Éditeur de scénarios).'
      },
      expose: {
        title: 'Exposer un port',
        listen: 'Lancez dans le terminal quelque chose qui écoute sur un port entre 1024 et 65535, par exemple python3 -m http.server 8080.',
        open: 'Cliquez sur la puce Ports dans l\'en-tête du terminal. Le panneau Ports exposés s\'ouvre ; le badge de la puce compte les ports déjà exposés.',
        port: 'Tapez le numéro de port et cliquez sur Exposer.',
        url: 'Une ligne apparaît avec le port, son URL publique, un sablier avec le temps restant, un bouton de copie et une corbeille. Cliquez sur l\'URL pour l\'ouvrir, ou sur Copier l\'URL pour la partager.',
        shot: 'Une session Debian en cours avec le port 8080 exposé : la puce Ports dans l\'en-tête, le panneau avec l\'URL publique, le temps restant, les boutons copier et arrêter.'
      },
      lifetime: {
        title: 'Combien de temps ça dure',
        ttl: 'Une exposition vit environ une heure (la durée exacte dépend de votre offre) ; le sablier décompte. À l\'expiration, l\'URL ne répond plus et la ligne disparaît.',
        session: 'Elle ne survit jamais à la session : quand le terminal expire, est arrêté ou détruit, l\'URL meurt avec lui.',
        stop: 'La corbeille arrête une exposition immédiatement. Pour republier le port, exposez-le à nouveau : vous obtenez une nouvelle URL.',
        several: 'Vous pouvez exposer jusqu\'à trois ports de la même session en même temps, chacun sur sa propre URL.'
      },
      caution: {
        title: 'À garder en tête',
        public: 'L\'URL est publique : quiconque l\'a peut l\'ouvrir, sans se connecter. N\'exposez rien qui montre des secrets, et arrêtez l\'exposition quand vous avez fini.',
        recording: 'Les commandes que vous tapez restent enregistrées, comme dans toute session.'
      },
      next: {
        gettingStarted: { title: 'Premiers pas avec les terminaux', description: 'Où se trouve l\'option Accès internet, et le reste du composeur.' },
        troubleshooting: { title: 'Dépannage des terminaux', description: 'Une option verrouillée, une limite d\'offre, une session qui ne démarre pas.' }
      }
    }
  }
})
</script>

<style scoped>
/* Page-specific styles only - common help article styles are in help-article.css */
</style>
