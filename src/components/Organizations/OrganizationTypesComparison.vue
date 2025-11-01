<template>
  <div class="org-types-comparison">
    <div class="comparison-header">
      <h3>
        <i class="fas fa-info-circle"></i>
        {{ t('organizations.organizationTypes') }}
      </h3>
      <button @click="isExpanded = !isExpanded" class="toggle-btn">
        <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        {{ isExpanded ? t('organizations.hideComparison') : t('organizations.showComparison') }}
      </button>
    </div>

    <div v-if="isExpanded" class="comparison-content">
      <div class="comparison-grid">
        <!-- Personal Column -->
        <div class="type-column personal-column">
          <div class="column-header">
            <div class="header-icon">
              <i class="fas fa-user"></i>
            </div>
            <h4>{{ t('organizations.personal') }}</h4>
          </div>
          <div class="column-content">
            <div class="feature-item">
              <i class="fas fa-users"></i>
              <div>
                <strong>{{ t('organizations.members') }}</strong>
                <span>{{ t('organizations.personalMembersLimit') }}</span>
              </div>
            </div>
            <div class="feature-item">
              <i class="fas fa-handshake"></i>
              <div>
                <strong>{{ t('organizations.collaboration') }}</strong>
                <span>{{ t('organizations.personalCollaboration') }}</span>
              </div>
            </div>
            <div class="feature-item">
              <i class="fas fa-credit-card"></i>
              <div>
                <strong>{{ t('organizations.subscriptions') }}</strong>
                <span>{{ t('organizations.personalSubscriptions') }}</span>
              </div>
            </div>
            <div class="feature-item">
              <i class="fas fa-bolt"></i>
              <div>
                <strong>{{ t('organizations.bestFor') }}</strong>
                <span>{{ t('organizations.personalBestFor') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Team Column -->
        <div class="type-column team-column">
          <div class="column-header">
            <div class="header-icon">
              <i class="fas fa-users"></i>
            </div>
            <h4>{{ t('organizations.team') }}</h4>
            <span class="recommended-badge">
              <i class="fas fa-star"></i>
              {{ t('organizations.recommended') }}
            </span>
          </div>
          <div class="column-content">
            <div class="feature-item">
              <i class="fas fa-users"></i>
              <div>
                <strong>{{ t('organizations.members') }}</strong>
                <span>{{ t('organizations.teamMembersLimit') }}</span>
              </div>
            </div>
            <div class="feature-item">
              <i class="fas fa-handshake"></i>
              <div>
                <strong>{{ t('organizations.collaboration') }}</strong>
                <span>{{ t('organizations.teamCollaboration') }}</span>
              </div>
            </div>
            <div class="feature-item">
              <i class="fas fa-credit-card"></i>
              <div>
                <strong>{{ t('organizations.subscriptions') }}</strong>
                <span>{{ t('organizations.teamSubscriptions') }}</span>
              </div>
            </div>
            <div class="feature-item">
              <i class="fas fa-bolt"></i>
              <div>
                <strong>{{ t('organizations.bestFor') }}</strong>
                <span>{{ t('organizations.teamBestFor') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="upgrade-notice">
        <i class="fas fa-arrow-right"></i>
        <p>
          <strong>{{ t('organizations.upgradeTitle') }}:</strong>
          {{ t('organizations.upgradeDescription') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTranslations } from '../../composables/useTranslations'

const isExpanded = ref(false)

const { t } = useTranslations({
  en: {
    organizations: {
      organizationTypes: 'Organization Types',
      showComparison: 'Show comparison',
      hideComparison: 'Hide comparison',
      personal: 'Personal',
      team: 'Team',
      recommended: 'Recommended',
      members: 'Members',
      collaboration: 'Collaboration',
      subscriptions: 'Subscriptions',
      bestFor: 'Best For',
      personalMembersLimit: '1 member only (you)',
      personalCollaboration: 'Not available',
      personalSubscriptions: 'Personal plans only',
      personalBestFor: 'Individual learning & testing',
      teamMembersLimit: 'Up to 100 members',
      teamCollaboration: 'Full collaboration features',
      teamSubscriptions: 'Organization plans & bulk licenses',
      teamBestFor: 'Classes, teams & organizations',
      upgradeTitle: 'Upgrade anytime',
      upgradeDescription: 'You can convert a personal organization to a team organization at any time from the organization settings.',
    }
  },
  fr: {
    organizations: {
      organizationTypes: 'Types d\'organisations',
      showComparison: 'Afficher la comparaison',
      hideComparison: 'Masquer la comparaison',
      personal: 'Personnel',
      team: 'Équipe',
      recommended: 'Recommandé',
      members: 'Membres',
      collaboration: 'Collaboration',
      subscriptions: 'Abonnements',
      bestFor: 'Idéal pour',
      personalMembersLimit: '1 membre seulement (vous)',
      personalCollaboration: 'Non disponible',
      personalSubscriptions: 'Plans personnels uniquement',
      personalBestFor: 'Apprentissage & tests individuels',
      teamMembersLimit: 'Jusqu\'à 100 membres',
      teamCollaboration: 'Fonctionnalités de collaboration complètes',
      teamSubscriptions: 'Plans d\'organisation & licences groupées',
      teamBestFor: 'Classes, équipes & organisations',
      upgradeTitle: 'Mise à niveau à tout moment',
      upgradeDescription: 'Vous pouvez convertir une organisation personnelle en organisation d\'équipe à tout moment depuis les paramètres de l\'organisation.',
    }
  }
})
</script>

<style scoped>
.org-types-comparison {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(16, 185, 129, 0.03) 100%);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  padding: 0;
  margin-bottom: 2rem;
  overflow: hidden;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
}

.comparison-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.comparison-header h3 i {
  color: var(--color-primary);
  font-size: 1rem;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.toggle-btn i {
  font-size: 0.75rem;
}

.comparison-content {
  padding: 1.5rem;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.type-column {
  background: var(--color-bg-primary);
  border: 2px solid;
  border-radius: 12px;
  overflow: hidden;
}

.personal-column {
  border-color: rgba(59, 130, 246, 0.3);
}

.team-column {
  border-color: rgba(16, 185, 129, 0.3);
  position: relative;
}

.column-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.personal-column .column-header {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(96, 165, 250, 0.05) 100%);
}

.team-column .column-header {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(52, 211, 153, 0.05) 100%);
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.personal-column .header-icon {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(96, 165, 250, 0.2) 100%);
  color: #2563eb;
}

.team-column .header-icon {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.2) 100%);
  color: #059669;
}

.column-header h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  flex: 1;
}

.recommended-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
}

.recommended-badge i {
  font-size: 0.625rem;
}

.column-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.feature-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.feature-item i {
  width: 24px;
  font-size: 1.125rem;
  margin-top: 2px;
  flex-shrink: 0;
}

.personal-column .feature-item i {
  color: #3b82f6;
}

.team-column .feature-item i {
  color: #10b981;
}

.feature-item div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.feature-item strong {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.feature-item span {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.upgrade-notice {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
  border: 1.5px dashed var(--color-border);
  border-radius: 10px;
}

.upgrade-notice i {
  font-size: 1.25rem;
  color: var(--color-primary);
  margin-top: 2px;
  flex-shrink: 0;
}

.upgrade-notice p {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.upgrade-notice strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

/* Responsive */
@media (max-width: 968px) {
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .comparison-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .toggle-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
