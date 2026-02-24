<template>
  <div class="legal-page">
    <div class="container">
      <div class="legal-header">
        <h1>{{ t('privacy.title') }}</h1>
        <p class="last-updated">{{ t('privacy.lastUpdated') }}: {{ t('privacy.updateDate') }}</p>
      </div>

      <div class="legal-content">
        <!-- Data Controller -->
        <section class="legal-section">
          <h2>{{ t('privacy.dataController.title') }}</h2>
          <div class="info-block">
            <p><strong>{{ t('privacy.dataController.publisher') }}:</strong> Solution Libre</p>
            <p><strong>{{ t('privacy.dataController.website') }}:</strong> <a href="https://solution-libre.fr" target="_blank" rel="noopener noreferrer">https://solution-libre.fr</a></p>
            <p><strong>{{ t('privacy.dataController.email') }}:</strong> <a href="mailto:contact@labinux.com">contact@labinux.com</a></p>
            <p><strong>{{ t('privacy.dataController.director') }}:</strong> Thomas Saquet</p>
          </div>
        </section>

        <!-- Data We Collect -->
        <section class="legal-section">
          <h2>{{ t('privacy.dataCollected.title') }}</h2>
          <div class="info-block">
            <ul>
              <li>{{ t('privacy.dataCollected.account') }}</li>
              <li>{{ t('privacy.dataCollected.terminal') }}</li>
              <li>{{ t('privacy.dataCollected.commandHistory') }}</li>
              <li>{{ t('privacy.dataCollected.usage') }}</li>
              <li>{{ t('privacy.dataCollected.billing') }}</li>
            </ul>
          </div>
        </section>

        <!-- Why We Collect It -->
        <section class="legal-section">
          <h2>{{ t('privacy.purposes.title') }}</h2>
          <div class="info-block">
            <ul>
              <li>{{ t('privacy.purposes.account') }}</li>
              <li>{{ t('privacy.purposes.terminal') }}</li>
              <li>{{ t('privacy.purposes.commandHistory') }}</li>
              <li>{{ t('privacy.purposes.usage') }}</li>
              <li>{{ t('privacy.purposes.billing') }}</li>
            </ul>
          </div>
        </section>

        <!-- Legal Basis -->
        <section class="legal-section">
          <h2>{{ t('privacy.legalBasis.title') }}</h2>
          <div class="info-block">
            <ul>
              <li>{{ t('privacy.legalBasis.consent') }}</li>
              <li>{{ t('privacy.legalBasis.contract') }}</li>
              <li>{{ t('privacy.legalBasis.legitimateInterest') }}</li>
            </ul>
          </div>
        </section>

        <!-- Command History Recording -->
        <section class="legal-section">
          <h2>{{ t('privacy.commandHistory.title') }}</h2>
          <div class="info-block">
            <p>{{ t('privacy.commandHistory.captured') }}</p>
            <p>{{ t('privacy.commandHistory.notCaptured') }}</p>
            <p>{{ t('privacy.commandHistory.access') }}</p>
            <p>{{ t('privacy.commandHistory.retention') }}</p>
            <p>{{ t('privacy.commandHistory.control') }}</p>
          </div>
        </section>

        <!-- Data Retention -->
        <section class="legal-section">
          <h2>{{ t('privacy.retention.title') }}</h2>
          <div class="info-block">
            <ul>
              <li>{{ t('privacy.retention.account') }}</li>
              <li>{{ t('privacy.retention.terminal') }}</li>
              <li>{{ t('privacy.retention.commandHistory') }}</li>
              <li>{{ t('privacy.retention.billing') }}</li>
              <li>{{ t('privacy.retention.usage') }}</li>
            </ul>
          </div>
        </section>

        <!-- Your Rights -->
        <section class="legal-section">
          <h2>{{ t('privacy.rights.title') }}</h2>
          <div class="info-block">
            <ul>
              <li>{{ t('privacy.rights.access') }}</li>
              <li>{{ t('privacy.rights.rectification') }}</li>
              <li>{{ t('privacy.rights.erasure') }}</li>
              <li>{{ t('privacy.rights.portability') }}</li>
              <li>{{ t('privacy.rights.withdrawConsent') }}</li>
              <li>{{ t('privacy.rights.complaint') }}</li>
            </ul>
          </div>
        </section>

        <!-- Data Security -->
        <section class="legal-section">
          <h2>{{ t('privacy.security.title') }}</h2>
          <div class="info-block">
            <ul>
              <li>{{ t('privacy.security.encryption') }}</li>
              <li>{{ t('privacy.security.hashing') }}</li>
              <li>{{ t('privacy.security.hosting') }}</li>
              <li>{{ t('privacy.security.accessControls') }}</li>
            </ul>
          </div>
        </section>

        <!-- Contact -->
        <section class="legal-section">
          <h2>{{ t('privacy.contact.title') }}</h2>
          <div class="info-block">
            <p>{{ t('privacy.contact.exerciseRights') }}: <a href="mailto:contact@labinux.com">contact@labinux.com</a></p>
            <p><strong>{{ t('privacy.contact.controller') }}:</strong> Solution Libre, Thomas Saquet</p>
            <p><strong>{{ t('privacy.contact.authority') }}:</strong> CNIL — <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a></p>
          </div>
        </section>
      </div>

      <div class="legal-footer">
        <router-link to="/" class="back-link">
          <i class="fas fa-arrow-left"></i> {{ t('privacy.backToHome') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated',
      updateDate: 'February 2026',

      dataController: {
        title: 'Data Controller',
        publisher: 'Publisher',
        website: 'Website',
        email: 'Email',
        director: 'Data Protection Contact'
      },

      dataCollected: {
        title: 'Data We Collect',
        account: 'Account data (email, username) for account creation and authentication',
        terminal: 'Terminal session data (session IDs, connection times, instance types) for service delivery',
        commandHistory: 'Command history (when consented) for pedagogical feedback and self-review',
        usage: 'Usage metrics (anonymized) for service improvement',
        billing: 'Billing data (processed via Stripe) for subscription management'
      },

      purposes: {
        title: 'Why We Collect It',
        account: 'Account data: service operation and authentication',
        terminal: 'Terminal sessions: delivering the training platform',
        commandHistory: 'Command history: enabling learners to review their work and trainers to give personalized feedback',
        usage: 'Usage metrics: improving the platform',
        billing: 'Billing: subscription and payment processing'
      },

      legalBasis: {
        title: 'Legal Basis (RGPD Art. 6)',
        consent: 'Consent (Art. 6.1.a): command history recording — you choose whether to enable this',
        contract: 'Contract (Art. 6.1.b): account data and billing — necessary for providing the service',
        legitimateInterest: 'Legitimate interest (Art. 6.1.f): anonymized usage metrics and security logs'
      },

      commandHistory: {
        title: 'Command History Recording',
        captured: 'What is captured: terminal commands you type during sessions.',
        notCaptured: 'What is NOT captured: passwords and tokens are redacted when possible, but you should avoid typing secrets directly in the terminal.',
        access: 'Who can see it: you (the learner), your trainer, and platform administrators.',
        retention: 'Retention: based on your subscription plan (shown as number of days when you consent).',
        control: 'Your control: you can export your command history or request deletion at any time.'
      },

      retention: {
        title: 'Data Retention',
        account: 'Account data: retained while your account is active, deleted within 30 days of account closure',
        terminal: 'Terminal sessions: session metadata retained for 90 days after session end',
        commandHistory: 'Command history: retention period depends on subscription plan (displayed at consent time)',
        billing: 'Billing data: retained as required by French accounting law (10 years for invoices)',
        usage: 'Usage metrics: anonymized, retained indefinitely'
      },

      rights: {
        title: 'Your Rights (RGPD Art. 15-22)',
        access: 'Right of access (Art. 15): request a copy of your data',
        rectification: 'Right to rectification (Art. 16): correct inaccurate data',
        erasure: 'Right to erasure (Art. 17): request deletion of your data',
        portability: 'Right to data portability (Art. 20): receive your data in a structured format',
        withdrawConsent: 'Right to withdraw consent (Art. 7.3): withdraw consent for command recording at any time',
        complaint: 'Right to lodge a complaint: with the CNIL (Commission Nationale de l\'Informatique et des Libertés)'
      },

      security: {
        title: 'Data Security',
        encryption: 'All data encrypted in transit (TLS/HTTPS)',
        hashing: 'API keys stored as SHA-256 hashes',
        hosting: 'Infrastructure hosted by Scaleway in France (EU), subject to RGPD',
        accessControls: 'Access controls and audit logging'
      },

      contact: {
        title: 'Contact',
        exerciseRights: 'To exercise your rights',
        controller: 'Data controller',
        authority: 'Supervisory authority'
      },

      backToHome: 'Back to Home'
    }
  },
  fr: {
    privacy: {
      title: 'Politique de confidentialité',
      lastUpdated: 'Dernière mise à jour',
      updateDate: 'Février 2026',

      dataController: {
        title: 'Responsable du traitement',
        publisher: 'Éditeur',
        website: 'Site web',
        email: 'Email',
        director: 'Contact protection des données'
      },

      dataCollected: {
        title: 'Données que nous collectons',
        account: 'Données de compte (email, nom d\'utilisateur) pour la création de compte et l\'authentification',
        terminal: 'Données de sessions terminal (identifiants de session, horaires de connexion, types d\'instance) pour la fourniture du service',
        commandHistory: 'Historique des commandes (avec consentement) pour le retour pédagogique et l\'auto-évaluation',
        usage: 'Métriques d\'utilisation (anonymisées) pour l\'amélioration du service',
        billing: 'Données de facturation (traitées via Stripe) pour la gestion des abonnements'
      },

      purposes: {
        title: 'Pourquoi nous collectons ces données',
        account: 'Données de compte : fonctionnement du service et authentification',
        terminal: 'Sessions terminal : fourniture de la plateforme de formation',
        commandHistory: 'Historique des commandes : permettre aux apprenants de revoir leur travail et aux formateurs de fournir un retour personnalisé',
        usage: 'Métriques d\'utilisation : amélioration de la plateforme',
        billing: 'Facturation : gestion des abonnements et traitement des paiements'
      },

      legalBasis: {
        title: 'Base légale (RGPD Art. 6)',
        consent: 'Consentement (Art. 6.1.a) : enregistrement de l\'historique des commandes — vous choisissez d\'activer ou non cette fonctionnalité',
        contract: 'Contrat (Art. 6.1.b) : données de compte et facturation — nécessaires à la fourniture du service',
        legitimateInterest: 'Intérêt légitime (Art. 6.1.f) : métriques d\'utilisation anonymisées et journaux de sécurité'
      },

      commandHistory: {
        title: 'Enregistrement de l\'historique des commandes',
        captured: 'Ce qui est capturé : les commandes terminal que vous saisissez pendant vos sessions.',
        notCaptured: 'Ce qui n\'est PAS capturé : les mots de passe et tokens sont masqués dans la mesure du possible, mais vous devez éviter de saisir des secrets directement dans le terminal.',
        access: 'Qui peut le consulter : vous (l\'apprenant), votre formateur et les administrateurs de la plateforme.',
        retention: 'Conservation : basée sur votre plan d\'abonnement (affichée en nombre de jours lors du consentement).',
        control: 'Votre contrôle : vous pouvez exporter votre historique de commandes ou demander sa suppression à tout moment.'
      },

      retention: {
        title: 'Conservation des données',
        account: 'Données de compte : conservées tant que votre compte est actif, supprimées dans les 30 jours suivant la fermeture du compte',
        terminal: 'Sessions terminal : métadonnées de session conservées 90 jours après la fin de la session',
        commandHistory: 'Historique des commandes : durée de conservation selon le plan d\'abonnement (affichée au moment du consentement)',
        billing: 'Données de facturation : conservées conformément à la loi comptable française (10 ans pour les factures)',
        usage: 'Métriques d\'utilisation : anonymisées, conservées indéfiniment'
      },

      rights: {
        title: 'Vos droits (RGPD Art. 15-22)',
        access: 'Droit d\'accès (Art. 15) : demander une copie de vos données',
        rectification: 'Droit de rectification (Art. 16) : corriger des données inexactes',
        erasure: 'Droit à l\'effacement (Art. 17) : demander la suppression de vos données',
        portability: 'Droit à la portabilité (Art. 20) : recevoir vos données dans un format structuré',
        withdrawConsent: 'Droit de retrait du consentement (Art. 7.3) : retirer votre consentement pour l\'enregistrement des commandes à tout moment',
        complaint: 'Droit de déposer une réclamation : auprès de la CNIL (Commission Nationale de l\'Informatique et des Libertés)'
      },

      security: {
        title: 'Sécurité des données',
        encryption: 'Toutes les données sont chiffrées en transit (TLS/HTTPS)',
        hashing: 'Les clés API sont stockées sous forme de hachages SHA-256',
        hosting: 'Infrastructure hébergée par Scaleway en France (UE), soumise au RGPD',
        accessControls: 'Contrôles d\'accès et journalisation des audits'
      },

      contact: {
        title: 'Contact',
        exerciseRights: 'Pour exercer vos droits',
        controller: 'Responsable du traitement',
        authority: 'Autorité de contrôle'
      },

      backToHome: 'Retour à l\'accueil'
    }
  }
})
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: 60px 20px 40px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.legal-header {
  margin-bottom: 50px;
  text-align: center;
  padding-bottom: 30px;
  border-bottom: 2px solid var(--color-border-light);
}

.legal-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 15px;
}

.last-updated {
  font-size: 0.95rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.legal-content {
  margin-bottom: 50px;
}

.legal-section {
  margin-bottom: 45px;
  padding: 35px;
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-light);
  transition: all 0.3s ease;
}

.legal-section:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.legal-section h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.legal-section h2::before {
  content: '';
  width: 4px;
  height: 28px;
  background: linear-gradient(180deg, var(--color-primary), var(--color-purple));
  border-radius: 2px;
}

.info-block {
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.info-block p {
  margin-bottom: 15px;
}

.info-block strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.info-block a {
  color: var(--color-primary);
  text-decoration: none;
  transition: opacity 0.3s ease;
}

.info-block a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.info-block ul {
  list-style: none;
  padding: 0;
  margin: 20px 0;
}

.info-block ul li {
  padding: 12px 0 12px 30px;
  position: relative;
  border-bottom: 1px solid var(--color-border-light);
}

.info-block ul li:last-child {
  border-bottom: none;
}

.info-block ul li::before {
  content: '\2022';
  position: absolute;
  left: 10px;
  color: var(--color-primary);
  font-size: 1.3rem;
  line-height: 1.6;
}

.legal-footer {
  text-align: center;
  padding-top: 30px;
  border-top: 1px solid var(--color-border-light);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 28px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  text-decoration: none;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-medium);
  transition: all 0.3s ease;
  font-weight: 500;
}

.back-link:hover {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Responsive Design */
@media (max-width: 768px) {
  .legal-page {
    padding: 40px 15px 30px;
  }

  .legal-header h1 {
    font-size: 2rem;
  }

  .legal-section {
    padding: 25px 20px;
    margin-bottom: 30px;
  }

  .legal-section h2 {
    font-size: 1.4rem;
  }
}

@media (max-width: 480px) {
  .legal-header h1 {
    font-size: 1.75rem;
  }

  .legal-section h2 {
    font-size: 1.25rem;
  }

  .legal-section {
    padding: 20px 15px;
  }
}
</style>
