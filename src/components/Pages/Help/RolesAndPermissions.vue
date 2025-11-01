<template>
  <div class="help-page roles-permissions">
    <div class="help-header">
      <h1>
        <i class="fas fa-user-shield"></i>
        {{ t('help.rolesTitle') }}
      </h1>
      <p class="subtitle">{{ t('help.rolesSubtitle') }}</p>
    </div>

    <div class="help-content">
      <!-- Overview Section -->
      <section class="help-section">
        <h2>{{ t('help.overviewTitle') }}</h2>
        <p>{{ t('help.overviewDescription') }}</p>

        <div class="role-levels">
          <div class="level-card">
            <div class="level-icon platform">
              <i class="fas fa-globe"></i>
            </div>
            <div class="level-content">
              <h3>{{ t('help.platformLevel') }}</h3>
              <p>{{ t('help.platformLevelDesc') }}</p>
            </div>
          </div>

          <div class="level-card">
            <div class="level-icon organization">
              <i class="fas fa-building"></i>
            </div>
            <div class="level-content">
              <h3>{{ t('help.organizationLevel') }}</h3>
              <p>{{ t('help.organizationLevelDesc') }}</p>
            </div>
          </div>

          <div class="level-card">
            <div class="level-icon group">
              <i class="fas fa-users-class"></i>
            </div>
            <div class="level-content">
              <h3>{{ t('help.groupLevel') }}</h3>
              <p>{{ t('help.groupLevelDesc') }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Organization Roles Section -->
      <section class="help-section">
        <h2>
          <i class="fas fa-building"></i>
          {{ t('help.orgRolesTitle') }}
        </h2>
        <p>{{ t('help.orgRolesDescription') }}</p>

        <div class="permission-matrix">
          <table>
            <thead>
              <tr>
                <th>{{ t('help.permission') }}</th>
                <th class="role-col owner-col">
                  <i class="fas fa-crown"></i>
                  {{ t('help.owner') }}
                </th>
                <th class="role-col manager-col">
                  <i class="fas fa-user-tie"></i>
                  {{ t('help.manager') }}
                </th>
                <th class="role-col member-col">
                  <i class="fas fa-user"></i>
                  {{ t('help.member') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="permission-name">{{ t('help.viewOrganization') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.inviteMembers') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.removeMembers') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.changeRoles') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-partial" :title="t('help.cannotPromoteToOwner')">
                  <i class="fas fa-minus"></i>
                </td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.promoteToOwner') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.manageBilling') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.manageSubscriptions') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.editOrgSettings') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.deleteOrganization') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.transferOwnership') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="legend">
          <div class="legend-item">
            <i class="fas fa-check legend-icon check"></i>
            <span>{{ t('help.allowed') }}</span>
          </div>
          <div class="legend-item">
            <i class="fas fa-minus legend-icon partial"></i>
            <span>{{ t('help.partial') }}</span>
          </div>
          <div class="legend-item">
            <i class="fas fa-times legend-icon cross"></i>
            <span>{{ t('help.denied') }}</span>
          </div>
        </div>
      </section>

      <!-- Group Roles Section -->
      <section class="help-section">
        <h2>
          <i class="fas fa-users-class"></i>
          {{ t('help.groupRolesTitle') }}
        </h2>
        <p>{{ t('help.groupRolesDescription') }}</p>

        <div class="role-descriptions">
          <div class="role-desc-card">
            <div class="role-desc-header owner-header">
              <i class="fas fa-crown"></i>
              <h3>{{ t('help.groupOwner') }}</h3>
            </div>
            <p>{{ t('help.groupOwnerDesc') }}</p>
            <ul>
              <li>{{ t('help.groupOwnerPerm1') }}</li>
              <li>{{ t('help.groupOwnerPerm2') }}</li>
              <li>{{ t('help.groupOwnerPerm3') }}</li>
            </ul>
          </div>

          <div class="role-desc-card">
            <div class="role-desc-header admin-header">
              <i class="fas fa-user-shield"></i>
              <h3>{{ t('help.groupAdmin') }}</h3>
            </div>
            <p>{{ t('help.groupAdminDesc') }}</p>
            <ul>
              <li>{{ t('help.groupAdminPerm1') }}</li>
              <li>{{ t('help.groupAdminPerm2') }}</li>
              <li>{{ t('help.groupAdminPerm3') }}</li>
            </ul>
          </div>

          <div class="role-desc-card">
            <div class="role-desc-header assistant-header">
              <i class="fas fa-hands-helping"></i>
              <h3>{{ t('help.groupAssistant') }}</h3>
            </div>
            <p>{{ t('help.groupAssistantDesc') }}</p>
            <ul>
              <li>{{ t('help.groupAssistantPerm1') }}</li>
              <li>{{ t('help.groupAssistantPerm2') }}</li>
              <li>{{ t('help.groupAssistantPerm3') }}</li>
            </ul>
          </div>

          <div class="role-desc-card">
            <div class="role-desc-header member-header">
              <i class="fas fa-user"></i>
              <h3>{{ t('help.groupMember') }}</h3>
            </div>
            <p>{{ t('help.groupMemberDesc') }}</p>
            <ul>
              <li>{{ t('help.groupMemberPerm1') }}</li>
              <li>{{ t('help.groupMemberPerm2') }}</li>
              <li>{{ t('help.groupMemberPerm3') }}</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Platform Admin Section -->
      <section class="help-section">
        <h2>
          <i class="fas fa-user-cog"></i>
          {{ t('help.platformAdminTitle') }}
        </h2>
        <div class="admin-notice">
          <i class="fas fa-shield-alt"></i>
          <div>
            <p><strong>{{ t('help.platformAdminNoticeTitle') }}</strong></p>
            <p>{{ t('help.platformAdminNoticeDesc') }}</p>
          </div>
        </div>
      </section>

      <!-- Common Scenarios -->
      <section class="help-section">
        <h2>
          <i class="fas fa-question-circle"></i>
          {{ t('help.scenariosTitle') }}
        </h2>

        <div class="scenarios">
          <div class="scenario">
            <h4>{{ t('help.scenario1Question') }}</h4>
            <p>{{ t('help.scenario1Answer') }}</p>
          </div>

          <div class="scenario">
            <h4>{{ t('help.scenario2Question') }}</h4>
            <p>{{ t('help.scenario2Answer') }}</p>
          </div>

          <div class="scenario">
            <h4>{{ t('help.scenario3Question') }}</h4>
            <p>{{ t('help.scenario3Answer') }}</p>
          </div>

          <div class="scenario">
            <h4>{{ t('help.scenario4Question') }}</h4>
            <p>{{ t('help.scenario4Answer') }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '../../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    help: {
      rolesTitle: 'Roles and Permissions',
      rolesSubtitle: 'Understanding user roles and access control in the system',
      overviewTitle: 'Overview',
      overviewDescription: 'The system uses a three-tier role model to manage access and permissions at different levels.',
      platformLevel: 'Platform Level',
      platformLevelDesc: 'System-wide administrator access with full control',
      organizationLevel: 'Organization Level',
      organizationLevelDesc: 'Manage organizations, members, billing, and subscriptions',
      groupLevel: 'Group Level',
      groupLevelDesc: 'Manage groups (classrooms), courses, and student access',
      orgRolesTitle: 'Organization Roles',
      orgRolesDescription: 'These roles control access to organization management features:',
      permission: 'Permission',
      owner: 'Owner',
      manager: 'Manager',
      member: 'Member',
      viewOrganization: 'View organization',
      inviteMembers: 'Invite members',
      removeMembers: 'Remove members',
      changeRoles: 'Change member roles',
      promoteToOwner: 'Promote members to owner',
      manageBilling: 'Manage billing',
      manageSubscriptions: 'Manage subscriptions',
      editOrgSettings: 'Edit organization settings',
      deleteOrganization: 'Delete organization',
      transferOwnership: 'Transfer ownership',
      allowed: 'Allowed',
      partial: 'Partial (with restrictions)',
      denied: 'Not allowed',
      cannotPromoteToOwner: 'Can change roles to member or manager, but not to owner',
      groupRolesTitle: 'Group Roles',
      groupRolesDescription: 'Groups represent classrooms or teams within an organization:',
      groupOwner: 'Owner',
      groupOwnerDesc: 'The group creator with full control over the group.',
      groupOwnerPerm1: 'Delete the group',
      groupOwnerPerm2: 'Transfer ownership',
      groupOwnerPerm3: 'Assign admins and assistants',
      groupAdmin: 'Admin',
      groupAdminDesc: 'Co-instructors with management permissions.',
      groupAdminPerm1: 'Manage group content and courses',
      groupAdminPerm2: 'Add/remove members',
      groupAdminPerm3: 'View group analytics',
      groupAssistant: 'Assistant',
      groupAssistantDesc: 'Teaching assistants with limited management access.',
      groupAssistantPerm1: 'Help manage group activities',
      groupAssistantPerm2: 'View member progress',
      groupAssistantPerm3: 'Assist with course delivery',
      groupMember: 'Member',
      groupMemberDesc: 'Students or participants in the group.',
      groupMemberPerm1: 'Access group content',
      groupMemberPerm2: 'Participate in courses',
      groupMemberPerm3: 'Use assigned resources',
      platformAdminTitle: 'Platform Administrator',
      platformAdminNoticeTitle: 'System-wide access',
      platformAdminNoticeDesc: 'Platform administrators have unrestricted access to all organizations, groups, and features. This role is reserved for system operators and bypasses all organization and group permissions.',
      scenariosTitle: 'Common Scenarios',
      scenario1Question: 'Can a manager delete an organization?',
      scenario1Answer: 'No. Only organization owners can delete organizations to prevent accidental data loss.',
      scenario2Question: 'Can a manager promote someone to owner?',
      scenario2Answer: 'No. Only current owners can promote members to owner status. Managers can only assign member or manager roles.',
      scenario3Question: 'What happens if an organization owner leaves?',
      scenario3Answer: 'The owner should transfer ownership to another member before leaving. If not, contact support to reassign ownership.',
      scenario4Question: 'Can I have multiple roles?',
      scenario4Answer: 'Yes. You can be an owner of one organization, a manager of another, and a member of groups within different organizations.',
    }
  },
  fr: {
    help: {
      rolesTitle: 'Rôles et permissions',
      rolesSubtitle: 'Comprendre les rôles utilisateur et le contrôle d\'accès dans le système',
      overviewTitle: 'Vue d\'ensemble',
      overviewDescription: 'Le système utilise un modèle de rôles à trois niveaux pour gérer l\'accès et les permissions à différents niveaux.',
      platformLevel: 'Niveau plateforme',
      platformLevelDesc: 'Accès administrateur système avec contrôle total',
      organizationLevel: 'Niveau organisation',
      organizationLevelDesc: 'Gérer les organisations, membres, facturation et abonnements',
      groupLevel: 'Niveau groupe',
      groupLevelDesc: 'Gérer les groupes (classes), cours et accès des étudiants',
      orgRolesTitle: 'Rôles d\'organisation',
      orgRolesDescription: 'Ces rôles contrôlent l\'accès aux fonctionnalités de gestion d\'organisation :',
      permission: 'Permission',
      owner: 'Propriétaire',
      manager: 'Gestionnaire',
      member: 'Membre',
      viewOrganization: 'Voir l\'organisation',
      inviteMembers: 'Inviter des membres',
      removeMembers: 'Retirer des membres',
      changeRoles: 'Changer les rôles des membres',
      promoteToOwner: 'Promouvoir des membres en propriétaires',
      manageBilling: 'Gérer la facturation',
      manageSubscriptions: 'Gérer les abonnements',
      editOrgSettings: 'Modifier les paramètres',
      deleteOrganization: 'Supprimer l\'organisation',
      transferOwnership: 'Transférer la propriété',
      allowed: 'Autorisé',
      partial: 'Partiel (avec restrictions)',
      denied: 'Non autorisé',
      cannotPromoteToOwner: 'Peut changer les rôles en membre ou gestionnaire, mais pas en propriétaire',
      groupRolesTitle: 'Rôles de groupe',
      groupRolesDescription: 'Les groupes représentent des classes ou équipes au sein d\'une organisation :',
      groupOwner: 'Propriétaire',
      groupOwnerDesc: 'Le créateur du groupe avec contrôle total.',
      groupOwnerPerm1: 'Supprimer le groupe',
      groupOwnerPerm2: 'Transférer la propriété',
      groupOwnerPerm3: 'Assigner des administrateurs et assistants',
      groupAdmin: 'Administrateur',
      groupAdminDesc: 'Co-instructeurs avec permissions de gestion.',
      groupAdminPerm1: 'Gérer le contenu et les cours du groupe',
      groupAdminPerm2: 'Ajouter/retirer des membres',
      groupAdminPerm3: 'Voir les analyses du groupe',
      groupAssistant: 'Assistant',
      groupAssistantDesc: 'Assistants pédagogiques avec accès de gestion limité.',
      groupAssistantPerm1: 'Aider à gérer les activités du groupe',
      groupAssistantPerm2: 'Voir la progression des membres',
      groupAssistantPerm3: 'Assister avec la livraison des cours',
      groupMember: 'Membre',
      groupMemberDesc: 'Étudiants ou participants du groupe.',
      groupMemberPerm1: 'Accéder au contenu du groupe',
      groupMemberPerm2: 'Participer aux cours',
      groupMemberPerm3: 'Utiliser les ressources assignées',
      platformAdminTitle: 'Administrateur plateforme',
      platformAdminNoticeTitle: 'Accès système complet',
      platformAdminNoticeDesc: 'Les administrateurs plateforme ont un accès illimité à toutes les organisations, groupes et fonctionnalités. Ce rôle est réservé aux opérateurs système et contourne toutes les permissions d\'organisation et de groupe.',
      scenariosTitle: 'Scénarios courants',
      scenario1Question: 'Un gestionnaire peut-il supprimer une organisation ?',
      scenario1Answer: 'Non. Seuls les propriétaires d\'organisation peuvent supprimer des organisations pour éviter la perte accidentelle de données.',
      scenario2Question: 'Un gestionnaire peut-il promouvoir quelqu\'un en propriétaire ?',
      scenario2Answer: 'Non. Seuls les propriétaires actuels peuvent promouvoir des membres au statut de propriétaire. Les gestionnaires ne peuvent assigner que les rôles de membre ou gestionnaire.',
      scenario3Question: 'Que se passe-t-il si le propriétaire d\'une organisation part ?',
      scenario3Answer: 'Le propriétaire devrait transférer la propriété à un autre membre avant de partir. Sinon, contactez le support pour réassigner la propriété.',
      scenario4Question: 'Puis-je avoir plusieurs rôles ?',
      scenario4Answer: 'Oui. Vous pouvez être propriétaire d\'une organisation, gestionnaire d\'une autre, et membre de groupes dans différentes organisations.',
    }
  }
})
</script>

<style scoped>
.help-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.help-header {
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid var(--color-border);
}

.help-header h1 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.help-header h1 i {
  color: var(--color-primary);
  font-size: 2.25rem;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.help-section h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 1.5rem 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.help-section h2 i {
  color: var(--color-primary);
  font-size: 1.5rem;
}

.help-section > p {
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.role-levels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.level-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.level-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.level-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
}

.level-icon.platform {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.15) 100%);
  color: #6366f1;
}

.level-icon.organization {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.15) 100%);
  color: #3b82f6;
}

.level-icon.group {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.15) 100%);
  color: #10b981;
}

.level-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.level-content p {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.permission-matrix {
  overflow-x: auto;
  margin: 2rem 0;
}

.permission-matrix table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-bg-primary);
  border-radius: 12px;
  overflow: hidden;
}

.permission-matrix thead {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
}

.permission-matrix th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9375rem;
}

.permission-matrix .role-col {
  text-align: center;
  min-width: 120px;
}

.permission-matrix th i {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.permission-matrix tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background 0.2s ease;
}

.permission-matrix tbody tr:hover {
  background: var(--color-bg-secondary);
}

.permission-matrix tbody tr:last-child {
  border-bottom: none;
}

.permission-matrix td {
  padding: 1rem 1.5rem;
  font-size: 0.9375rem;
}

.permission-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.permission-check,
.permission-cross,
.permission-partial {
  text-align: center;
  font-size: 1.25rem;
}

.permission-check i {
  color: var(--color-success);
}

.permission-cross i {
  color: var(--color-danger);
}

.permission-partial i {
  color: var(--color-warning);
}

.legend {
  display: flex;
  gap: 2rem;
  padding: 1rem 1.5rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.legend-icon {
  font-size: 1rem;
}

.legend-icon.check {
  color: var(--color-success);
}

.legend-icon.cross {
  color: var(--color-danger);
}

.legend-icon.partial {
  color: var(--color-warning);
}

.role-descriptions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.role-desc-card {
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.role-desc-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.role-desc-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
}

.owner-header {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.admin-header {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
}

.assistant-header {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.member-header {
  background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
}

.role-desc-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.role-desc-header i {
  font-size: 1.25rem;
}

.role-desc-card p {
  padding: 1rem 1.5rem 0.5rem 1.5rem;
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.role-desc-card ul {
  padding: 0.5rem 1.5rem 1.5rem 3rem;
  margin: 0;
  list-style: disc;
}

.role-desc-card li {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.admin-notice {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.08) 100%);
  border: 2px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  margin-top: 1.5rem;
}

.admin-notice i {
  font-size: 2.5rem;
  color: #dc2626;
  flex-shrink: 0;
}

.admin-notice p {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.admin-notice strong {
  color: #dc2626;
  font-weight: 600;
  font-size: 1rem;
}

.scenarios {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.scenario {
  padding: 1.5rem;
  background: var(--color-bg-primary);
  border-left: 4px solid var(--color-primary);
  border-radius: 8px;
}

.scenario h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.scenario p {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 768px) {
  .help-page {
    padding: 1rem;
  }

  .help-header h1 {
    font-size: 2rem;
  }

  .help-section h2 {
    font-size: 1.5rem;
  }

  .permission-matrix {
    font-size: 0.875rem;
  }

  .permission-matrix th,
  .permission-matrix td {
    padding: 0.75rem 1rem;
  }

  .legend {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
