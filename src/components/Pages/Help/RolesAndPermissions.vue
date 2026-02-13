<template>
  <div class="help-article roles-permissions">
    <div class="help-nav">
      <router-link :to="helpMainRoute" class="back-link">
        <i class="fas fa-arrow-left"></i>
        {{ t('help.navigation.backToHelp') }}
      </router-link>
    </div>
    <div class="help-header">
      <h1>
        <i class="fas fa-user-shield"></i>
        {{ t('help.account.rolesAndPermissions.rolesTitle') }}
      </h1>
      <p class="subtitle">{{ t('help.account.rolesAndPermissions.rolesSubtitle') }}</p>
    </div>

    <div class="help-content">
      <!-- Overview Section -->
      <section class="help-section">
        <h2>{{ t('help.account.rolesAndPermissions.overviewTitle') }}</h2>
        <p>{{ t('help.account.rolesAndPermissions.overviewDescription') }}</p>

        <div class="role-levels">
          <div class="level-card">
            <div class="level-icon platform">
              <i class="fas fa-globe"></i>
            </div>
            <div class="level-content">
              <h3>{{ t('help.account.rolesAndPermissions.platformLevel') }}</h3>
              <p>{{ t('help.account.rolesAndPermissions.platformLevelDesc') }}</p>
            </div>
          </div>

          <div class="level-card">
            <div class="level-icon organization">
              <i class="fas fa-building"></i>
            </div>
            <div class="level-content">
              <h3>{{ t('help.account.rolesAndPermissions.organizationLevel') }}</h3>
              <p>{{ t('help.account.rolesAndPermissions.organizationLevelDesc') }}</p>
            </div>
          </div>

          <div class="level-card">
            <div class="level-icon group">
              <i class="fas fa-users-class"></i>
            </div>
            <div class="level-content">
              <h3>{{ t('help.account.rolesAndPermissions.groupLevel') }}</h3>
              <p>{{ t('help.account.rolesAndPermissions.groupLevelDesc') }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Organization Roles Section -->
      <section class="help-section">
        <h2>
          <i class="fas fa-building"></i>
          {{ t('help.account.rolesAndPermissions.orgRolesTitle') }}
        </h2>
        <p>{{ t('help.account.rolesAndPermissions.orgRolesDescription') }}</p>

        <div class="permission-matrix">
          <table>
            <thead>
              <tr>
                <th>{{ t('help.account.rolesAndPermissions.permission') }}</th>
                <th class="role-col owner-col">
                  <i class="fas fa-crown"></i>
                  {{ t('help.account.rolesAndPermissions.owner') }}
                </th>
                <th class="role-col manager-col">
                  <i class="fas fa-user-tie"></i>
                  {{ t('help.account.rolesAndPermissions.manager') }}
                </th>
                <th class="role-col member-col">
                  <i class="fas fa-user"></i>
                  {{ t('help.account.rolesAndPermissions.member') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="permission-name">{{ t('help.account.rolesAndPermissions.viewOrganization') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.account.rolesAndPermissions.inviteMembers') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.account.rolesAndPermissions.removeMembers') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.account.rolesAndPermissions.changeRoles') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-partial" :title="t('help.account.rolesAndPermissions.cannotPromoteToOwner')">
                  <i class="fas fa-minus"></i>
                </td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.account.rolesAndPermissions.promoteToOwner') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.account.rolesAndPermissions.manageBilling') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.account.rolesAndPermissions.manageSubscriptions') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.account.rolesAndPermissions.editOrgSettings') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.account.rolesAndPermissions.deleteOrganization') }}</td>
                <td class="permission-check"><i class="fas fa-check"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
                <td class="permission-cross"><i class="fas fa-times"></i></td>
              </tr>
              <tr>
                <td class="permission-name">{{ t('help.account.rolesAndPermissions.transferOwnership') }}</td>
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
            <span>{{ t('help.account.rolesAndPermissions.allowed') }}</span>
          </div>
          <div class="legend-item">
            <i class="fas fa-minus legend-icon partial"></i>
            <span>{{ t('help.account.rolesAndPermissions.partial') }}</span>
          </div>
          <div class="legend-item">
            <i class="fas fa-times legend-icon cross"></i>
            <span>{{ t('help.account.rolesAndPermissions.denied') }}</span>
          </div>
        </div>
      </section>

      <!-- Group Roles Section -->
      <section class="help-section">
        <h2>
          <i class="fas fa-users-class"></i>
          {{ t('help.account.rolesAndPermissions.groupRolesTitle') }}
        </h2>
        <p>{{ t('help.account.rolesAndPermissions.groupRolesDescription') }}</p>

        <div class="role-descriptions">
          <div class="role-desc-card">
            <div class="role-desc-header owner-header">
              <i class="fas fa-crown"></i>
              <h3>{{ t('help.account.rolesAndPermissions.groupOwner') }}</h3>
            </div>
            <p>{{ t('help.account.rolesAndPermissions.groupOwnerDesc') }}</p>
            <ul>
              <li>{{ t('help.account.rolesAndPermissions.groupOwnerPerm1') }}</li>
              <li>{{ t('help.account.rolesAndPermissions.groupOwnerPerm2') }}</li>
              <li>{{ t('help.account.rolesAndPermissions.groupOwnerPerm3') }}</li>
            </ul>
          </div>

          <div class="role-desc-card">
            <div class="role-desc-header admin-header">
              <i class="fas fa-user-shield"></i>
              <h3>{{ t('help.account.rolesAndPermissions.groupAdmin') }}</h3>
            </div>
            <p>{{ t('help.account.rolesAndPermissions.groupAdminDesc') }}</p>
            <ul>
              <li>{{ t('help.account.rolesAndPermissions.groupAdminPerm1') }}</li>
              <li>{{ t('help.account.rolesAndPermissions.groupAdminPerm2') }}</li>
              <li>{{ t('help.account.rolesAndPermissions.groupAdminPerm3') }}</li>
            </ul>
          </div>

          <div class="role-desc-card">
            <div class="role-desc-header assistant-header">
              <i class="fas fa-hands-helping"></i>
              <h3>{{ t('help.account.rolesAndPermissions.groupAssistant') }}</h3>
            </div>
            <p>{{ t('help.account.rolesAndPermissions.groupAssistantDesc') }}</p>
            <ul>
              <li>{{ t('help.account.rolesAndPermissions.groupAssistantPerm1') }}</li>
              <li>{{ t('help.account.rolesAndPermissions.groupAssistantPerm2') }}</li>
              <li>{{ t('help.account.rolesAndPermissions.groupAssistantPerm3') }}</li>
            </ul>
          </div>

          <div class="role-desc-card">
            <div class="role-desc-header member-header">
              <i class="fas fa-user"></i>
              <h3>{{ t('help.account.rolesAndPermissions.groupMember') }}</h3>
            </div>
            <p>{{ t('help.account.rolesAndPermissions.groupMemberDesc') }}</p>
            <ul>
              <li>{{ t('help.account.rolesAndPermissions.groupMemberPerm1') }}</li>
              <li>{{ t('help.account.rolesAndPermissions.groupMemberPerm2') }}</li>
              <li>{{ t('help.account.rolesAndPermissions.groupMemberPerm3') }}</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Platform Admin Section -->
      <section class="help-section">
        <h2>
          <i class="fas fa-user-cog"></i>
          {{ t('help.account.rolesAndPermissions.platformAdminTitle') }}
        </h2>
        <div class="admin-notice">
          <i class="fas fa-shield-alt"></i>
          <div>
            <p><strong>{{ t('help.account.rolesAndPermissions.platformAdminNoticeTitle') }}</strong></p>
            <p>{{ t('help.account.rolesAndPermissions.platformAdminNoticeDesc') }}</p>
          </div>
        </div>
      </section>

      <!-- Common Scenarios -->
      <section class="help-section">
        <h2>
          <i class="fas fa-question-circle"></i>
          {{ t('help.account.rolesAndPermissions.scenariosTitle') }}
        </h2>

        <div class="scenarios">
          <div class="scenario">
            <h4>{{ t('help.account.rolesAndPermissions.scenario1Question') }}</h4>
            <p>{{ t('help.account.rolesAndPermissions.scenario1Answer') }}</p>
          </div>

          <div class="scenario">
            <h4>{{ t('help.account.rolesAndPermissions.scenario2Question') }}</h4>
            <p>{{ t('help.account.rolesAndPermissions.scenario2Answer') }}</p>
          </div>

          <div class="scenario">
            <h4>{{ t('help.account.rolesAndPermissions.scenario3Question') }}</h4>
            <p>{{ t('help.account.rolesAndPermissions.scenario3Answer') }}</p>
          </div>

          <div class="scenario">
            <h4>{{ t('help.account.rolesAndPermissions.scenario4Question') }}</h4>
            <p>{{ t('help.account.rolesAndPermissions.scenario4Answer') }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useHelpTranslations } from '../../../composables/useHelpTranslations'

const { t } = useI18n()
const { loadHelpTranslations } = useHelpTranslations()
const route = useRoute()

const isPublicHelp = computed(() => route.path.startsWith('/help-public'))
const helpMainRoute = computed(() => isPublicHelp.value ? '/help-public' : '/help')

onMounted(async () => {
  await loadHelpTranslations()
})
</script>

<style scoped>
.help-article {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.help-nav {
  margin-bottom: 30px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: var(--color-primary-hover);
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
  color: var(--color-purple);
}

.level-icon.organization {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.15) 100%);
  color: var(--color-org-personal);
}

.level-icon.group {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.15) 100%);
  color: var(--color-org-team);
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
  background: linear-gradient(135deg, var(--color-warning-amber) 0%, var(--color-warning-amber-light) 100%);
}

.admin-header {
  background: linear-gradient(135deg, var(--color-org-personal) 0%, var(--color-org-personal-light) 100%);
}

.assistant-header {
  background: linear-gradient(135deg, var(--color-org-team) 0%, var(--color-org-team-light) 100%);
}

.member-header {
  background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-gray-500) 100%);
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
  color: var(--color-danger);
  flex-shrink: 0;
}

.admin-notice p {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.admin-notice strong {
  color: var(--color-danger);
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
  .help-article {
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
