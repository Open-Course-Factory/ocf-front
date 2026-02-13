<template>
  <div class="legal-page">
    <div class="container">
      <div class="legal-header">
        <h1>{{ t('legal.title') }}</h1>
        <p class="last-updated">{{ t('legal.lastUpdated') }}: {{ t('legal.updateDate') }}</p>
      </div>

      <div class="legal-content">
        <!-- Site Information -->
        <section class="legal-section">
          <h2>{{ t('legal.siteInfo.title') }}</h2>
          <div class="info-block">
            <p><strong>{{ t('legal.siteInfo.publisher') }}:</strong> Solution Libre</p>
            <p><strong>{{ t('legal.siteInfo.website') }}:</strong> <a href="https://solution-libre.fr" target="_blank" rel="noopener noreferrer">https://solution-libre.fr</a></p>
            <p><strong>{{ t('legal.siteInfo.email') }}:</strong> <a href="mailto:contact@labinux.com">contact@labinux.com</a></p>
            <p><strong>{{ t('legal.siteInfo.director') }}:</strong> Thomas Saquet</p>
          </div>
        </section>

        <!-- Hosting -->
        <section class="legal-section">
          <h2>{{ t('legal.hosting.title') }}</h2>
          <div class="info-block">
            <p>{{ t('legal.hosting.description') }}</p>
          </div>
        </section>

        <!-- Intellectual Property -->
        <section class="legal-section">
          <h2>{{ t('legal.intellectualProperty.title') }}</h2>
          <div class="info-block">
            <p>{{ t('legal.intellectualProperty.description') }}</p>
            <p class="license-info">
              <strong>{{ t('legal.intellectualProperty.license') }}:</strong>
              {{ t('legal.intellectualProperty.agpl') }}
            </p>
            <p>
              <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" class="license-link">
                <i class="fas fa-external-link-alt"></i> {{ t('legal.intellectualProperty.viewLicense') }}
              </a>
            </p>
            <p>
              <a href="https://usine.solution-libre.fr/open-course-factory/" target="_blank" rel="noopener noreferrer" class="license-link">
                <i class="fab fa-gitlab"></i> {{ t('legal.intellectualProperty.sourceCode') }}
              </a>
            </p>
          </div>
        </section>

        <!-- Personal Data -->
        <section class="legal-section">
          <h2>{{ t('legal.personalData.title') }}</h2>
          <div class="info-block">
            <p>{{ t('legal.personalData.collection') }}</p>
            <ul>
              <li>{{ t('legal.personalData.item1') }}</li>
              <li>{{ t('legal.personalData.item2') }}</li>
              <li>{{ t('legal.personalData.item3') }}</li>
              <li>{{ t('legal.personalData.item4') }}</li>
            </ul>
            <p>{{ t('legal.personalData.rights') }}</p>
          </div>
        </section>

        <!-- Cookies -->
        <section class="legal-section">
          <h2>{{ t('legal.cookies.title') }}</h2>
          <div class="info-block">
            <p>{{ t('legal.cookies.description') }}</p>
            <ul>
              <li>{{ t('legal.cookies.type1') }}</li>
              <li>{{ t('legal.cookies.type2') }}</li>
              <li>{{ t('legal.cookies.type3') }}</li>
            </ul>
          </div>
        </section>

        <!-- Liability -->
        <section class="legal-section">
          <h2>{{ t('legal.liability.title') }}</h2>
          <div class="info-block">
            <p>{{ t('legal.liability.description') }}</p>
          </div>
        </section>

        <!-- Applicable Law -->
        <section class="legal-section">
          <h2>{{ t('legal.applicableLaw.title') }}</h2>
          <div class="info-block">
            <p>{{ t('legal.applicableLaw.description') }}</p>
          </div>
        </section>
      </div>

      <div class="legal-footer">
        <router-link to="/" class="back-link">
          <i class="fas fa-arrow-left"></i> {{ t('legal.backToHome') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslations } from '../../composables/useTranslations'

const { t } = useTranslations({
  en: {
    legal: {
      title: 'Legal Notices',
      lastUpdated: 'Last updated',
      updateDate: 'January 2025',

      siteInfo: {
        title: 'Site Information',
        publisher: 'Publisher',
        website: 'Website',
        email: 'Email',
        director: 'Publication Director'
      },

      hosting: {
        title: 'Hosting',
        description: 'This site is hosted by Solution Libre, using infrastructure provided by SCALEWAY SAS BP 438 75366 PARIS CEDEX 08 FRANCE. The platform runs on self-managed servers to ensure full control over data and security.'
      },

      intellectualProperty: {
        title: 'Intellectual Property',
        description: 'Open Course Factory is free and open-source software released under the GNU Affero General Public License version 3 (AGPL-3.0). You are free to use, modify, and redistribute this software under the terms of the AGPL-3.0 license.',
        license: 'License',
        agpl: 'GNU Affero General Public License v3.0 (AGPL-3.0)',
        viewLicense: 'View Full License Text',
        sourceCode: 'Access Source Code on GitLab'
      },

      personalData: {
        title: 'Personal Data Protection',
        collection: 'In accordance with the General Data Protection Regulation (GDPR), Open Course Factory collects and processes the following personal data:',
        item1: 'Email address and username for account creation',
        item2: 'Session data for terminal access and authentication',
        item3: 'Usage metrics for service improvement (anonymized)',
        item4: 'Billing information when using paid features (processed securely via Stripe)',
        rights: 'You have the right to access, rectify, delete, or port your personal data. To exercise these rights, please contact us at contact@labinux.com.'
      },

      cookies: {
        title: 'Cookies',
        description: 'This site uses strictly necessary cookies for the following purposes:',
        type1: 'Authentication: Maintaining your logged-in session',
        type2: 'User preferences: Storing theme, language, and interface settings',
        type3: 'Security: Protecting against CSRF attacks and ensuring secure communication'
      },

      liability: {
        title: 'Limitation of Liability',
        description: 'Open Course Factory provides educational terminal access "as is" without warranty of any kind. Solution Libre cannot be held liable for damages resulting from the use of this platform, including but not limited to data loss, service interruption, or security incidents. Users are responsible for their actions within the provided terminals.'
      },

      applicableLaw: {
        title: 'Applicable Law',
        description: 'These legal notices are governed by French law. Any disputes arising from the use of this site will be subject to the exclusive jurisdiction of French courts.'
      },

      backToHome: 'Back to Home'
    }
  },
  fr: {
    legal: {
      title: 'Mentions légales',
      lastUpdated: 'Dernière mise à jour',
      updateDate: 'Janvier 2025',

      siteInfo: {
        title: 'Informations sur le site',
        publisher: 'Éditeur',
        website: 'Site web',
        email: 'Email',
        director: 'Directeur de publication'
      },

      hosting: {
        title: 'Hébergement',
        description: 'Ce site est hébergé par Solution Libre, utilisant une infrastructure fournie par SCALEWAY SAS BP 438 75366 PARIS CEDEX 08 FRANCE. La plateforme fonctionne sur des serveurs autogérés pour garantir un contrôle total sur les données et la sécurité.'
      },

      intellectualProperty: {
        title: 'Propriété intellectuelle',
        description: 'Open Course Factory est un logiciel libre et open source publié sous la licence GNU Affero General Public License version 3 (AGPL-3.0). Vous êtes libre d\'utiliser, modifier et redistribuer ce logiciel selon les termes de la licence AGPL-3.0.',
        license: 'Licence',
        agpl: 'GNU Affero General Public License v3.0 (AGPL-3.0)',
        viewLicense: 'Voir le texte complet de la licence',
        sourceCode: 'Accéder au code source sur GitLab'
      },

      personalData: {
        title: 'Protection des données personnelles',
        collection: 'Conformément au Règlement Général sur la Protection des Données (RGPD), Open Course Factory collecte et traite les données personnelles suivantes :',
        item1: 'Adresse email et nom d\'utilisateur pour la création de compte',
        item2: 'Données de session pour l\'accès aux terminaux et l\'authentification',
        item3: 'Métriques d\'utilisation pour l\'amélioration du service (anonymisées)',
        item4: 'Informations de facturation lors de l\'utilisation de fonctionnalités payantes (traitées de manière sécurisée via Stripe)',
        rights: 'Vous disposez d\'un droit d\'accès, de rectification, de suppression et de portabilité de vos données personnelles. Pour exercer ces droits, contactez-nous à contact@labinux.com.'
      },

      cookies: {
        title: 'Cookies',
        description: 'Ce site utilise des cookies strictement nécessaires aux finalités suivantes :',
        type1: 'Authentification : Maintien de votre session connectée',
        type2: 'Préférences utilisateur : Stockage du thème, de la langue et des paramètres d\'interface',
        type3: 'Sécurité : Protection contre les attaques CSRF et garantie de communication sécurisée'
      },

      liability: {
        title: 'Limitation de responsabilité',
        description: 'Open Course Factory fournit un accès éducatif aux terminaux "en l\'état" sans garantie d\'aucune sorte. Solution Libre ne peut être tenu responsable des dommages résultant de l\'utilisation de cette plateforme, y compris mais sans s\'y limiter, la perte de données, l\'interruption de service ou les incidents de sécurité. Les utilisateurs sont responsables de leurs actions dans les terminaux fournis.'
      },

      applicableLaw: {
        title: 'Droit applicable',
        description: 'Les présentes mentions légales sont régies par le droit français. Tout litige découlant de l\'utilisation de ce site sera soumis à la compétence exclusive des tribunaux français.'
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
  content: '•';
  position: absolute;
  left: 10px;
  color: var(--color-primary);
  font-size: 1.3rem;
  line-height: 1.6;
}

.license-info {
  margin-top: 20px;
  padding: 15px;
  background: var(--color-bg-tertiary);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--border-radius-sm);
}

.license-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  margin: 10px 10px 0 0;
  background: var(--color-primary) !important;
  color: var(--color-white) !important;
  text-decoration: none !important;
  border-radius: var(--border-radius-md);
  transition: all 0.3s ease;
  font-weight: 500;
}

.license-link:hover {
  background: var(--color-primary-hover) !important;
  color: var(--color-white) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  text-decoration: none !important;
  opacity: 1 !important;
}

.license-link i {
  color: var(--color-white) !important;
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

  .license-link {
    display: flex;
    margin: 10px 0;
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
