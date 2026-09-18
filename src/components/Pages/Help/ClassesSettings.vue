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
      <h1><i class="fas fa-cog"></i> {{ t('helpClasses.settings.title') }}</h1>
      <p class="article-description">{{ t('helpClasses.settings.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-sliders-h"></i> {{ t('helpClasses.settings.page.title') }}</h2>
        <p>{{ t('helpClasses.settings.page.p1') }}</p>
        <HelpScreenshot name="class-settings" :caption="t('helpClasses.settings.page.caption')" />
        <ul>
          <li v-html="t('helpClasses.settings.page.edit')"></li>
          <li v-html="t('helpClasses.settings.page.max')"></li>
          <li v-html="t('helpClasses.settings.page.expires')"></li>
          <li v-html="t('helpClasses.settings.page.info')"></li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-sitemap"></i> {{ t('helpClasses.settings.subgroups.title') }}</h2>
        <p>{{ t('helpClasses.settings.subgroups.p1') }}</p>
        <ul>
          <li>{{ t('helpClasses.settings.subgroups.create') }}</li>
          <li>{{ t('helpClasses.settings.subgroups.own') }}</li>
          <li>{{ t('helpClasses.settings.subgroups.roster') }}</li>
          <li>{{ t('helpClasses.settings.subgroups.hierarchy') }}</li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-archive"></i> {{ t('helpClasses.settings.archive.title') }}</h2>
        <p>{{ t('helpClasses.settings.archive.p1') }}</p>
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.settings.archive.step1.title') }}</h4>
            <p>{{ t('helpClasses.settings.archive.step1.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.settings.archive.step2.title') }}</h4>
            <p>{{ t('helpClasses.settings.archive.step2.description') }}</p>
            <ul>
              <li v-html="t('helpClasses.settings.archive.step2.continuing')"></li>
              <li v-html="t('helpClasses.settings.archive.step2.left')"></li>
              <li v-html="t('helpClasses.settings.archive.step2.locked')"></li>
            </ul>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.settings.archive.step3.title') }}</h4>
            <p>{{ t('helpClasses.settings.archive.step3.description') }}</p>
          </div>
        </div>
        <h3>{{ t('helpClasses.settings.archive.effects.title') }}</h3>
        <ul>
          <li>{{ t('helpClasses.settings.archive.effects.class') }}</li>
          <li>{{ t('helpClasses.settings.archive.effects.console') }}</li>
          <li>{{ t('helpClasses.settings.archive.effects.continuing') }}</li>
          <li>{{ t('helpClasses.settings.archive.effects.left') }}</li>
          <li>{{ t('helpClasses.settings.archive.effects.restore') }}</li>
        </ul>
        <div class="help-section info ocf-help-inset">
          <p>{{ t('helpClasses.settings.archive.autoExpire') }}</p>
        </div>
      </section>

      <section class="help-section warning">
        <h2><i class="fas fa-trash"></i> {{ t('helpClasses.settings.delete.title') }}</h2>
        <div class="warning-content">
          <p>{{ t('helpClasses.settings.delete.p1') }}</p>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/classes/members`" class="next-step-card">
            <i class="fas fa-user-plus"></i>
            <h4>{{ t('helpClasses.settings.next.members.title') }}</h4>
            <p>{{ t('helpClasses.settings.next.members.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/organizations/overview`" class="next-step-card">
            <i class="fas fa-building"></i>
            <h4>{{ t('helpClasses.settings.next.organizations.title') }}</h4>
            <p>{{ t('helpClasses.settings.next.organizations.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/groups/management`" class="next-step-card">
            <i class="fas fa-sitemap"></i>
            <h4>{{ t('helpClasses.settings.next.groups.title') }}</h4>
            <p>{{ t('helpClasses.settings.next.groups.description') }}</p>
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
      settings: {
        title: 'Settings and archiving',
        intro: 'The Settings page holds what describes the class — name, size, expiry, sub-groups — and the two ways of ending it: archiving at the end of the year, which keeps everything readable, and deleting, which does not.',
        page: {
          title: 'The Settings page',
          p1: 'For the owner and the managers of the class:',
          caption: 'The Settings page: the class description, its owner and organization, the archive button, and the sub-groups block underneath.',
          edit: '<strong>"Edit group"</strong> opens the form: display name, description, organization, parent group, maximum members and expiration date.',
          max: '<strong>Maximum members</strong> is enforced: adding a learner beyond it fails. Raise it here first.',
          expires: '<strong>Expiration date</strong> is optional. Once it has passed, the class is flagged "Expired" in the console and refuses new members. It is not archived on its own: archive it yourself (below).',
          info: 'The rest is read-only: current members, status (active or archived, with the date), owner, organization (a link to it), parent group, created and modified dates.'
        },
        subgroups: {
          title: 'Sub-groups',
          p1: 'A class can be split — half-groups for lab sessions, project teams — with sub-groups:',
          create: '"Add sub-group" creates a group whose parent is this class. It takes the same form as a class.',
          own: 'A sub-group is a class in its own right: it has its five pages, its own assignments and its own live view. "View" opens it.',
          roster: 'Its members also appear in the parent class\'s Learners page, badged with the sub-group\'s name, so the parent still sees the whole cohort.',
          hierarchy: 'The whole tree of an organization is drawn on the "Group hierarchy" page of the Groups menu, where a group can be moved under another parent by drag and drop.'
        },
        archive: {
          title: 'Archiving a class',
          p1: 'At the end of the year, archive rather than delete: the class closes but its roster and results stay readable. The owner and the managers can archive.',
          step1: {
            title: 'Click "Archive class"',
            description: 'Top right of the Settings page. A dialog lists every member of the class.'
          },
          step2: {
            title: 'Say who leaves the organization with the class',
            description: 'For each member, choose between:',
            continuing: '<strong>Continuing</strong> (the default) — the learner stays a member of the organization, ready to be put in next year\'s class.',
            left: '<strong>Has left</strong> — the learner is offboarded from the organization: they lose access today and their account is erased after the organization\'s retention delay (set by the organization owner in its settings; the platform default applies otherwise). The dialog states the delay.',
            locked: 'A learner who is also in another open class of the organization cannot be marked as left from here — the dialog says why. "Mark all as left" and "Keep all" set everyone at once.'
          },
          step3: {
            title: 'Confirm',
            description: 'The dialog says how many members will be offboarded, then "Archive the class". If the class is archived but the offboarding fails for someone, the message names the reason.'
          },
          effects: {
            title: 'What archiving changes',
            class: 'The class takes no new member, no new assignment and no new session. Existing results stay readable on the Analytics page and in the results of each scenario.',
            console: 'In "My classes" it moves to the "Archived classes" fold at the bottom of the page.',
            continuing: 'Learners marked as continuing keep their account and their organization membership; they simply no longer have this class.',
            left: 'Learners marked as left cannot log in any more. Their account is erased at the end of the retention delay. Adding them again by email (CSV import or "Add member") before that reinstates them.',
            restore: '"Restore class" on the Settings page reopens it. Restoring does not reinstate offboarded learners — the organization\'s Members tab does.'
          },
          autoExpire: 'Archiving is the only action that offboards learners. Removing a learner from the class, or letting the class expire, never touches their account or their organization membership.'
        },
        delete: {
          title: 'Deleting a class',
          p1: '"Delete group" is for a class created by mistake. It is permanent: the members are removed from it and the class disappears with its assignments. For a class that was actually taught, archive instead.'
        },
        next: {
          members: { title: 'Adding learners', description: 'Filling next year\'s class.' },
          organizations: { title: 'Organizations', description: 'Members, retention delay, offboarded members.' },
          groups: { title: 'Groups and hierarchy', description: 'The organization\'s group tree.' }
        }
      }
    }
  },
  fr: {
    helpClasses: {
      settings: {
        title: 'Réglages et archivage',
        intro: 'La page Réglages porte ce qui décrit la classe — nom, taille, expiration, sous-groupes — et les deux façons d\'y mettre fin : l\'archivage en fin d\'année, qui garde tout lisible, et la suppression, qui ne garde rien.',
        page: {
          title: 'La page Réglages',
          p1: 'Pour le propriétaire et les gestionnaires de la classe :',
          caption: 'La page Réglages : la description de la classe, son propriétaire et son organisation, le bouton d\'archivage, et le bloc des sous-groupes en dessous.',
          edit: '<strong>« Modifier le groupe »</strong> ouvre le formulaire : nom d\'affichage, description, organisation, groupe parent, membres maximum et date d\'expiration.',
          max: '<strong>Membres maximum</strong> est appliqué : ajouter un apprenant au-delà échoue. Relevez-le ici d\'abord.',
          expires: '<strong>Date d\'expiration</strong> est facultative. Une fois passée, la classe est signalée « Expirée » dans la console et refuse les nouveaux membres. Elle n\'est pas archivée toute seule : archivez-la vous-même (plus bas).',
          info: 'Le reste est en lecture seule : membres actuels, statut (active ou archivée, avec la date), propriétaire, organisation (un lien vers elle), groupe parent, dates de création et de modification.'
        },
        subgroups: {
          title: 'Les sous-groupes',
          p1: 'Une classe peut se découper — demi-groupes de TP, équipes projet — avec des sous-groupes :',
          create: '« Ajouter un sous-groupe » crée un groupe dont le parent est cette classe. Le formulaire est celui d\'une classe.',
          own: 'Un sous-groupe est une classe à part entière : il a ses cinq pages, ses propres assignations et son propre direct. « Voir » l\'ouvre.',
          roster: 'Ses membres apparaissent aussi dans la page Apprenants de la classe parente, avec le nom du sous-groupe en badge, pour que le parent voie toujours la cohorte entière.',
          hierarchy: 'L\'arbre complet d\'une organisation se dessine sur la page « Hiérarchie des groupes » du menu Groupes, où un groupe se déplace sous un autre parent par glisser-déposer.'
        },
        archive: {
          title: 'Archiver une classe',
          p1: 'En fin d\'année, archivez plutôt que supprimer : la classe se ferme mais son effectif et ses résultats restent consultables. Le propriétaire et les gestionnaires peuvent archiver.',
          step1: {
            title: 'Cliquez sur « Archiver la classe »',
            description: 'En haut à droite de la page Réglages. Une boîte de dialogue liste chaque membre de la classe.'
          },
          step2: {
            title: 'Dites qui quitte l\'organisation avec la classe',
            description: 'Pour chaque membre, choisissez entre :',
            continuing: '<strong>Continue</strong> (par défaut) — l\'apprenant reste membre de l\'organisation, prêt à rejoindre la classe de l\'an prochain.',
            left: '<strong>Parti</strong> — l\'apprenant est désinscrit de l\'organisation : il perd l\'accès aujourd\'hui et son compte est effacé après le délai de conservation de l\'organisation (fixé par le propriétaire de l\'organisation dans ses paramètres ; à défaut, le délai par défaut de la plateforme). La boîte de dialogue indique le délai.',
            locked: 'Un apprenant qui est aussi dans une autre classe ouverte de l\'organisation ne peut pas être marqué parti d\'ici — la boîte de dialogue dit pourquoi. « Tous partis » et « Tous continuent » règlent tout le monde d\'un coup.'
          },
          step3: {
            title: 'Confirmez',
            description: 'La boîte de dialogue indique combien de membres seront désinscrits, puis « Archiver la classe ». Si la classe est archivée mais que la désinscription échoue pour quelqu\'un, le message en donne la raison.'
          },
          effects: {
            title: 'Ce que l\'archivage change',
            class: 'La classe n\'accepte plus de nouveau membre, de nouvelle assignation ni de nouvelle session. Les résultats existants restent lisibles sur la page Analytiques et dans les résultats de chaque scénario.',
            console: 'Dans « Mes classes », elle passe dans le repli « Classes archivées » en bas de page.',
            continuing: 'Les apprenants marqués « Continue » gardent leur compte et leur appartenance à l\'organisation ; ils n\'ont simplement plus cette classe.',
            left: 'Les apprenants marqués « Parti » ne peuvent plus se connecter. Leur compte est effacé à la fin du délai de conservation. Les ajouter de nouveau par e-mail (import CSV ou « Ajouter un membre ») avant cette date les réintègre.',
            restore: '« Restaurer la classe » sur la page Réglages la rouvre. Restaurer ne réintègre pas les apprenants désinscrits — c\'est l\'onglet Membres de l\'organisation qui le fait.'
          },
          autoExpire: 'L\'archivage est la seule action qui désinscrit des apprenants. Retirer un apprenant de la classe, ou laisser la classe expirer, ne touche jamais à son compte ni à son appartenance à l\'organisation.'
        },
        delete: {
          title: 'Supprimer une classe',
          p1: '« Supprimer le groupe » sert à une classe créée par erreur. C\'est définitif : les membres en sont retirés et la classe disparaît avec ses assignations. Pour une classe qui a réellement servi, archivez.'
        },
        next: {
          members: { title: 'Ajouter des apprenants', description: 'Remplir la classe de l\'an prochain.' },
          organizations: { title: 'Organisations', description: 'Membres, délai de conservation, membres désinscrits.' },
          groups: { title: 'Groupes et hiérarchie', description: 'L\'arbre des groupes de l\'organisation.' }
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

.help-section h3 {
  margin: 20px 0 8px;
  font-size: 1.05rem;
  color: var(--color-text-primary);
}
</style>
