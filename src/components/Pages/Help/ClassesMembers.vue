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
      <h1><i class="fas fa-user-plus"></i> {{ t('helpClasses.members.title') }}</h1>
      <p class="article-description">{{ t('helpClasses.members.intro') }}</p>
    </div>

    <div class="article-content">
      <section class="help-section">
        <h2><i class="fas fa-users"></i> {{ t('helpClasses.members.page.title') }}</h2>
        <p>{{ t('helpClasses.members.page.p1') }}</p>
        <HelpScreenshot name="class-members" :caption="t('helpClasses.members.page.caption')" />
        <ul>
          <li v-html="t('helpClasses.members.page.card')"></li>
          <li v-html="t('helpClasses.members.page.role')"></li>
          <li v-html="t('helpClasses.members.page.remove')"></li>
          <li v-html="t('helpClasses.members.page.launch')"></li>
        </ul>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-user"></i> {{ t('helpClasses.members.one.title') }}</h2>
        <p>{{ t('helpClasses.members.one.p1') }}</p>
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.members.one.step1.title') }}</h4>
            <p>{{ t('helpClasses.members.one.step1.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.members.one.step2.title') }}</h4>
            <p>{{ t('helpClasses.members.one.step2.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.members.one.step3.title') }}</h4>
            <p>{{ t('helpClasses.members.one.step3.description') }}</p>
          </div>
        </div>
        <div class="help-section warning ocf-help-inset">
          <div class="warning-content">
            <p>{{ t('helpClasses.members.one.limits') }}</p>
          </div>
        </div>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-file-import"></i> {{ t('helpClasses.members.csv.title') }}</h2>
        <p>{{ t('helpClasses.members.csv.p1') }}</p>
        <HelpScreenshot name="organization-import" :caption="t('helpClasses.members.csv.caption')" />
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.members.csv.step1.title') }}</h4>
            <p v-html="t('helpClasses.members.csv.step1.description')"></p>
            <div class="code-example"><code>email,name<br>marie.dupont@univ-labinux.example,DUPONT Marie<br>jean.martin@univ-labinux.example,MARTIN Jean</code></div>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.members.csv.step2.title') }}</h4>
            <ul>
              <li v-html="t('helpClasses.members.csv.step2.target')"></li>
              <li v-html="t('helpClasses.members.csv.step2.verified')"></li>
              <li v-html="t('helpClasses.members.csv.step2.update')"></li>
            </ul>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.members.csv.step3.title') }}</h4>
            <p>{{ t('helpClasses.members.csv.step3.description') }}</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-number">4</div>
          <div class="step-content">
            <h4>{{ t('helpClasses.members.csv.step4.title') }}</h4>
            <p>{{ t('helpClasses.members.csv.step4.description') }}</p>
          </div>
        </div>
        <p>
          <router-link :to="`${helpRoutePrefix}/organizations/bulk-import`" class="btn btn-outline">
            <i class="fas fa-file-csv"></i>
            {{ t('helpClasses.members.csv.button') }}
          </router-link>
        </p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-key"></i> {{ t('helpClasses.members.passwords.title') }}</h2>
        <p>{{ t('helpClasses.members.passwords.p1') }}</p>
        <ol>
          <li>{{ t('helpClasses.members.passwords.s1') }}</li>
          <li>{{ t('helpClasses.members.passwords.s2') }}</li>
          <li>{{ t('helpClasses.members.passwords.s3') }}</li>
        </ol>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-user-tag"></i> {{ t('helpClasses.members.roles.title') }}</h2>
        <ul>
          <li v-html="t('helpClasses.members.roles.member')"></li>
          <li v-html="t('helpClasses.members.roles.manager')"></li>
          <li v-html="t('helpClasses.members.roles.owner')"></li>
        </ul>
        <p>{{ t('helpClasses.members.roles.subgroups') }}</p>
      </section>

      <section class="help-section">
        <h2><i class="fas fa-question-circle"></i> {{ t('help.navigation.nextSteps') }}</h2>
        <div class="next-steps">
          <router-link :to="`${helpRoutePrefix}/classes/scenarios`" class="next-step-card">
            <i class="fas fa-clipboard-list"></i>
            <h4>{{ t('helpClasses.members.next.scenarios.title') }}</h4>
            <p>{{ t('helpClasses.members.next.scenarios.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/organizations/bulk-import`" class="next-step-card">
            <i class="fas fa-file-import"></i>
            <h4>{{ t('helpClasses.members.next.import.title') }}</h4>
            <p>{{ t('helpClasses.members.next.import.description') }}</p>
          </router-link>
          <router-link :to="`${helpRoutePrefix}/classes/settings`" class="next-step-card">
            <i class="fas fa-cog"></i>
            <h4>{{ t('helpClasses.members.next.settings.title') }}</h4>
            <p>{{ t('helpClasses.members.next.settings.description') }}</p>
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
      members: {
        title: 'Adding learners',
        intro: 'Two ways to fill a class: add people who already have an OCF account one by one from the Learners page, or create the accounts and the class in one go with a CSV import at organization level.',
        page: {
          title: 'The Learners page',
          p1: 'The roster of the class, owner first, then every member with their role. Only the owner and the managers see the action buttons.',
          caption: 'The Learners page of a class: the owner first, then each learner with a role selector and a remove button.',
          card: '<strong>Each card</strong> shows the name, email, role badge, the group the member comes from ("Main group" or a sub-group) and the date they joined.',
          role: '<strong>The role selector</strong> changes a member to manager (or back). Only the owner can hand over the owner role.',
          remove: '<strong>Remove</strong> takes the learner out of the class. Their account and their organization membership are untouched.',
          launch: '<strong>"Start a scenario for the class"</strong> is a shortcut to the Scenarios page, where an assigned scenario can be started for everyone at once.'
        },
        one: {
          title: 'Adding a learner one by one',
          p1: 'For someone who already has an OCF account.',
          step1: {
            title: 'Click "Add member"',
            description: 'Top right of the Learners page.'
          },
          step2: {
            title: 'Find the person',
            description: 'Type at least two characters of their name or email and pick them in the list. Someone who does not appear has no account yet: create it through the CSV import below.'
          },
          step3: {
            title: 'Choose the role and confirm',
            description: '"Member" for a learner, "Manager" for a colleague who will co-teach the class.'
          },
          limits: 'A class at its maximum members refuses the addition ("Group is at maximum capacity" — raise the limit in Settings). An archived class refuses new members too: restore it first.'
        },
        csv: {
          title: 'Importing a whole class by CSV',
          p1: 'The import is done at organization level: open Organizations, then your organization, then "Bulk import" (the "Import" button on the organization card leads to the same page). It creates the accounts, the groups and the memberships from up to three files.',
          caption: 'The bulk import page: three CSV drop zones, then the import options.',
          step1: {
            title: 'Prepare the files',
            description: '<strong>Users CSV</strong> (required): <code>email</code> and <code>name</code> are enough; <code>first_name</code>, <code>last_name</code>, <code>password</code>, <code>role</code> and <code>external_id</code> are optional. A single name column is split into first and last name — the file preview lets you adjust the cut per row. Missing passwords are generated. <strong>Groups CSV</strong> and <strong>Memberships CSV</strong> are optional: they create classes and put users in them (<code>user_email,group_name,role</code>). "Download examples" gives you the four templates. Comma, semicolon and tab separators are all detected.'
          },
          step2: {
            title: 'Choose the options',
            target: '<strong>Target group</strong> — every imported user is added to this class. The simplest way to fill a class you have already created.',
            verified: '<strong>Mark imported email addresses as verified</strong> — ticked by default: the organization vouches for the addresses and the learners can log in at once. Untick to make each learner confirm their address first.',
            update: '<strong>Update existing users if found</strong> — an email already known is updated instead of skipped.'
          },
          step3: {
            title: '"Validate & Import": nothing is written yet',
            description: 'The first pass is a dry run. You get a summary — how many users will be created, updated or skipped, how many groups and memberships — and the row-by-row errors. Fix the file and try again, or "Proceed with import".'
          },
          step4: {
            title: 'Download the credentials',
            description: 'When passwords were generated, the result screen offers a CSV of the credentials. It is the only time they are shown: download it before closing. Later, you can regenerate passwords from the Learners page (below).'
          },
          button: 'The full bulk-import guide'
        },
        passwords: {
          title: 'Regenerating passwords',
          p1: 'For learners who lost theirs, or when you did not keep the credentials file:',
          s1: 'On the Learners page, tick the learners concerned ("Select all" ticks everyone but the owner).',
          s2: 'Click "Regenerate passwords (n)" and confirm — their current passwords stop working immediately.',
          s3: 'The new credentials are shown once; download the CSV or copy them before closing.'
        },
        roles: {
          title: 'Roles in a class',
          member: '<strong>Member</strong> — a learner. Sees the Learners page of the class, receives the sessions started for the class, appears in the live view and the results.',
          manager: '<strong>Manager</strong> — a co-trainer. Sees all five pages, adds and removes learners, assigns and starts scenarios, supervises terminals. Not counted as a learner.',
          owner: '<strong>Owner</strong> — the creator. Everything a manager can do, plus deleting the class and handing over the owner role.',
          subgroups: 'Members of a sub-group are listed in the parent class too, with the sub-group\'s name as a badge.'
        },
        next: {
          scenarios: { title: 'Assigning scenarios', description: 'Give the class something to do.' },
          import: { title: 'Bulk import', description: 'File formats, options and results in detail.' },
          settings: { title: 'Settings and archiving', description: 'Size limit, sub-groups, closing the class.' }
        }
      }
    }
  },
  fr: {
    helpClasses: {
      members: {
        title: 'Ajouter des apprenants',
        intro: 'Deux façons de remplir une classe : ajouter un par un, depuis la page Apprenants, des personnes qui ont déjà un compte OCF, ou créer les comptes et la classe d\'un coup par un import CSV au niveau de l\'organisation.',
        page: {
          title: 'La page Apprenants',
          p1: 'L\'effectif de la classe : le propriétaire d\'abord, puis chaque membre avec son rôle. Seuls le propriétaire et les gestionnaires voient les boutons d\'action.',
          caption: 'La page Apprenants d\'une classe : le propriétaire d\'abord, puis chaque apprenant avec un sélecteur de rôle et un bouton de retrait.',
          card: '<strong>Chaque carte</strong> montre le nom, l\'e-mail, le badge de rôle, le groupe d\'origine (« Groupe principal » ou un sous-groupe) et la date d\'arrivée.',
          role: '<strong>Le sélecteur de rôle</strong> passe un membre gestionnaire (ou l\'inverse). Seul le propriétaire peut céder le rôle de propriétaire.',
          remove: '<strong>Retirer</strong> sort l\'apprenant de la classe. Son compte et son appartenance à l\'organisation ne changent pas.',
          launch: '<strong>« Lancer un scénario pour la classe »</strong> est un raccourci vers la page Scénarios, d\'où un scénario assigné se lance pour tout le monde en une fois.'
        },
        one: {
          title: 'Ajouter un apprenant un par un',
          p1: 'Pour une personne qui a déjà un compte OCF.',
          step1: {
            title: 'Cliquez sur « Ajouter un membre »',
            description: 'En haut à droite de la page Apprenants.'
          },
          step2: {
            title: 'Trouvez la personne',
            description: 'Tapez au moins deux caractères de son nom ou de son e-mail et choisissez-la dans la liste. Quelqu\'un qui n\'apparaît pas n\'a pas encore de compte : créez-le par l\'import CSV ci-dessous.'
          },
          step3: {
            title: 'Choisissez le rôle et validez',
            description: '« Membre » pour un apprenant, « Gestionnaire » pour un collègue qui co-animera la classe.'
          },
          limits: 'Une classe qui a atteint ses membres maximum refuse l\'ajout (« Le groupe a atteint sa capacité maximale » — relevez la limite dans les Réglages). Une classe archivée refuse aussi les nouveaux membres : restaurez-la d\'abord.'
        },
        csv: {
          title: 'Importer une classe entière par CSV',
          p1: 'L\'import se fait au niveau de l\'organisation : ouvrez Organisations, puis votre organisation, puis « Importation groupée » (le bouton « Importer » de la carte de l\'organisation mène à la même page). Il crée les comptes, les groupes et les adhésions à partir de trois fichiers au plus.',
          caption: 'La page d\'importation groupée : trois zones de dépôt CSV, puis les options d\'import.',
          step1: {
            title: 'Préparez les fichiers',
            description: '<strong>CSV des utilisateurs</strong> (requis) : <code>email</code> et <code>name</code> suffisent ; <code>first_name</code>, <code>last_name</code>, <code>password</code>, <code>role</code> et <code>external_id</code> sont facultatifs. Une colonne de nom unique est découpée en prénom et nom — l\'aperçu du fichier permet d\'ajuster la coupe ligne par ligne. Les mots de passe absents sont générés. <strong>CSV des groupes</strong> et <strong>CSV des adhésions</strong> sont facultatifs : ils créent des classes et y placent les utilisateurs (<code>user_email,group_name,role</code>). « Télécharger des exemples » vous donne les quatre modèles. Virgule, point-virgule et tabulation sont détectés.'
          },
          step2: {
            title: 'Choisissez les options',
            target: '<strong>Groupe cible</strong> — chaque utilisateur importé est ajouté à cette classe. Le plus simple pour remplir une classe déjà créée.',
            verified: '<strong>Marquer les adresses e-mail importées comme vérifiées</strong> — coché par défaut : l\'organisation se porte garante des adresses et les apprenants se connectent tout de suite. Décochez pour que chaque apprenant confirme d\'abord son adresse.',
            update: '<strong>Mettre à jour les utilisateurs existants</strong> — un e-mail déjà connu est mis à jour au lieu d\'être ignoré.'
          },
          step3: {
            title: '« Valider & importer » : rien n\'est encore écrit',
            description: 'Le premier passage est une simulation. Vous obtenez un résumé — combien d\'utilisateurs seront créés, mis à jour ou ignorés, combien de groupes et d\'adhésions — et les erreurs ligne par ligne. Corrigez le fichier et recommencez, ou « Procéder à l\'import ».'
          },
          step4: {
            title: 'Téléchargez les identifiants',
            description: 'Quand des mots de passe ont été générés, l\'écran de résultat propose un CSV des identifiants. C\'est la seule fois où ils s\'affichent : téléchargez-le avant de fermer. Plus tard, vous pourrez régénérer des mots de passe depuis la page Apprenants (ci-dessous).'
          },
          button: 'Le guide complet de l\'import'
        },
        passwords: {
          title: 'Régénérer des mots de passe',
          p1: 'Pour les apprenants qui ont perdu le leur, ou si vous n\'avez pas gardé le fichier d\'identifiants :',
          s1: 'Sur la page Apprenants, cochez les apprenants concernés (« Tout sélectionner » coche tout le monde sauf le propriétaire).',
          s2: 'Cliquez sur « Régénérer les mots de passe (n) » et confirmez — leurs mots de passe actuels cessent de fonctionner immédiatement.',
          s3: 'Les nouveaux identifiants s\'affichent une seule fois ; téléchargez le CSV ou copiez-les avant de fermer.'
        },
        roles: {
          title: 'Les rôles dans une classe',
          member: '<strong>Membre</strong> — un apprenant. Voit la page Apprenants de la classe, reçoit les sessions lancées pour la classe, apparaît dans le direct et les résultats.',
          manager: '<strong>Gestionnaire</strong> — un co-formateur. Voit les cinq pages, ajoute et retire des apprenants, assigne et lance des scénarios, supervise les terminaux. N\'est pas compté comme apprenant.',
          owner: '<strong>Propriétaire</strong> — le créateur. Tout ce que peut un gestionnaire, plus la suppression de la classe et la cession du rôle de propriétaire.',
          subgroups: 'Les membres d\'un sous-groupe apparaissent aussi dans la classe parente, avec le nom du sous-groupe en badge.'
        },
        next: {
          scenarios: { title: 'Assigner des scénarios', description: 'Donnez du travail à la classe.' },
          import: { title: 'Importation groupée', description: 'Formats de fichiers, options et résultats en détail.' },
          settings: { title: 'Réglages et archivage', description: 'Limite de taille, sous-groupes, clôture de la classe.' }
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
