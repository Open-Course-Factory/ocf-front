<template>
  <div class="terms-of-service">
    <div class="terms-header">
      <h2>{{ t('tos.title') }}</h2>
      <p class="last-updated">{{ t('tos.lastUpdated', { date: lastUpdateDate }) }}</p>
    </div>

    <div class="terms-content">
      <section>
        <h3>{{ t('tos.acceptance.title') }}</h3>
        <p>{{ t('tos.acceptance.content') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.description.title') }}</h3>
        <p>{{ t('tos.description.content') }}</p>
        <p>{{ t('tos.description.saasNature') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.userAccount.title') }}</h3>
        <p>{{ t('tos.userAccount.content') }}</p>
        <ul>
          <li>{{ t('tos.userAccount.accurate') }}</li>
          <li>{{ t('tos.userAccount.confidential') }}</li>
          <li>{{ t('tos.userAccount.notify') }}</li>
          <li>{{ t('tos.userAccount.eligibility') }}</li>
          <li>{{ t('tos.userAccount.oneAccount') }}</li>
        </ul>
      </section>

      <section>
        <h3>{{ t('tos.serviceAccess.title') }}</h3>
        <p>{{ t('tos.serviceAccess.intro') }}</p>
        <ul>
          <li>{{ t('tos.serviceAccess.revocation') }}</li>
          <li>{{ t('tos.serviceAccess.availability') }}</li>
          <li>{{ t('tos.serviceAccess.maintenance') }}</li>
          <li>{{ t('tos.serviceAccess.modifications') }}</li>
        </ul>
      </section>

      <section>
        <h3>{{ t('tos.machineUsage.title') }}</h3>
        <p>{{ t('tos.machineUsage.intro') }}</p>
        <ul>
          <li>{{ t('tos.machineUsage.logging') }}</li>
          <li>{{ t('tos.machineUsage.monitoring') }}</li>
          <li>{{ t('tos.machineUsage.abuse') }}</li>
          <li>{{ t('tos.machineUsage.resources') }}</li>
          <li>{{ t('tos.machineUsage.isolation') }}</li>
        </ul>
        <p><strong>{{ t('tos.machineUsage.warningTitle') }}</strong> {{ t('tos.machineUsage.warningContent') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.dataProtection.title') }}</h3>
        <p>{{ t('tos.dataProtection.gdprIntro') }}</p>
        <ul>
          <li><strong>{{ t('tos.dataProtection.dataCollected.title') }}</strong> {{ t('tos.dataProtection.dataCollected.content') }}</li>
          <li><strong>{{ t('tos.dataProtection.technicalData.title') }}</strong> {{ t('tos.dataProtection.technicalData.content') }}</li>
          <li><strong>{{ t('tos.dataProtection.purpose.title') }}</strong> {{ t('tos.dataProtection.purpose.content') }}</li>
          <li><strong>{{ t('tos.dataProtection.legalBasis.title') }}</strong> {{ t('tos.dataProtection.legalBasis.content') }}</li>
          <li><strong>{{ t('tos.dataProtection.rights.title') }}</strong> {{ t('tos.dataProtection.rights.content') }}</li>
          <li><strong>{{ t('tos.dataProtection.retention.title') }}</strong> {{ t('tos.dataProtection.retention.content') }}</li>
          <li><strong>{{ t('tos.dataProtection.security.title') }}</strong> {{ t('tos.dataProtection.security.content') }}</li>
          <li><strong>{{ t('tos.dataProtection.transfer.title') }}</strong> {{ t('tos.dataProtection.transfer.content') }}</li>
        </ul>
        <p>{{ t('tos.dataProtection.contact') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.acceptableUse.title') }}</h3>
        <p>{{ t('tos.acceptableUse.intro') }}</p>
        <ul>
          <li>{{ t('tos.acceptableUse.illegal') }}</li>
          <li>{{ t('tos.acceptableUse.harm') }}</li>
          <li>{{ t('tos.acceptableUse.malware') }}</li>
          <li>{{ t('tos.acceptableUse.spam') }}</li>
          <li>{{ t('tos.acceptableUse.mining') }}</li>
          <li>{{ t('tos.acceptableUse.ddos') }}</li>
          <li>{{ t('tos.acceptableUse.scraping') }}</li>
          <li>{{ t('tos.acceptableUse.interference') }}</li>
          <li>{{ t('tos.acceptableUse.unauthorized') }}</li>
          <li>{{ t('tos.acceptableUse.reverseEngineer') }}</li>
          <li>{{ t('tos.acceptableUse.impersonation') }}</li>
        </ul>
        <p><strong>{{ t('tos.acceptableUse.consequencesTitle') }}</strong> {{ t('tos.acceptableUse.consequencesContent') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.subscriptionPayment.title') }}</h3>
        <p>{{ t('tos.subscriptionPayment.intro') }}</p>
        <ul>
          <li><strong>{{ t('tos.subscriptionPayment.billing.title') }}</strong> {{ t('tos.subscriptionPayment.billing.content') }}</li>
          <li><strong>{{ t('tos.subscriptionPayment.renewal.title') }}</strong> {{ t('tos.subscriptionPayment.renewal.content') }}</li>
          <li><strong>{{ t('tos.subscriptionPayment.cancellation.title') }}</strong> {{ t('tos.subscriptionPayment.cancellation.content') }}</li>
          <li><strong>{{ t('tos.subscriptionPayment.refunds.title') }}</strong> {{ t('tos.subscriptionPayment.refunds.content') }}</li>
          <li><strong>{{ t('tos.subscriptionPayment.priceChanges.title') }}</strong> {{ t('tos.subscriptionPayment.priceChanges.content') }}</li>
          <li><strong>{{ t('tos.subscriptionPayment.taxes.title') }}</strong> {{ t('tos.subscriptionPayment.taxes.content') }}</li>
        </ul>
      </section>

      <section>
        <h3>{{ t('tos.withdrawal.title') }}</h3>
        <p>{{ t('tos.withdrawal.right') }}</p>
        <p>{{ t('tos.withdrawal.immediateStart') }}</p>
        <p>{{ t('tos.withdrawal.howTo') }}</p>
        <p>{{ t('tos.withdrawal.refund') }}</p>
        <p><strong>{{ t('tos.withdrawal.professionalTitle') }}</strong> {{ t('tos.withdrawal.professional') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.intellectualProperty.title') }}</h3>
        <p>{{ t('tos.intellectualProperty.ownership') }}</p>
        <p>{{ t('tos.intellectualProperty.license') }}</p>
        <p>{{ t('tos.intellectualProperty.userContent') }}</p>
        <p>{{ t('tos.intellectualProperty.feedback') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.thirdPartyServices.title') }}</h3>
        <p>{{ t('tos.thirdPartyServices.content') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.termination.title') }}</h3>
        <p>{{ t('tos.termination.byUs') }}</p>
        <p>{{ t('tos.termination.byYou') }}</p>
        <p>{{ t('tos.termination.effects') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.warranties.title') }}</h3>
        <p>{{ t('tos.warranties.disclaimer') }}</p>
        <p>{{ t('tos.warranties.availability') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.liability.title') }}</h3>
        <p>{{ t('tos.liability.limitation') }}</p>
        <p>{{ t('tos.liability.exclusions') }}</p>
        <p>{{ t('tos.liability.indemnification') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.dataBackup.title') }}</h3>
        <p>{{ t('tos.dataBackup.responsibility') }}</p>
        <p>{{ t('tos.dataBackup.noGuarantee') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.modifications.title') }}</h3>
        <p>{{ t('tos.modifications.right') }}</p>
        <p>{{ t('tos.modifications.notification') }}</p>
        <p>{{ t('tos.modifications.acceptance') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.disputeResolution.title') }}</h3>
        <p>{{ t('tos.disputeResolution.negotiation') }}</p>
        <p v-if="mediator.name">{{ t('tos.disputeResolution.consumerMediation') }}</p>
        <p v-if="mediator.name" class="contact-info">{{ mediatorContact }}</p>
        <p v-else>{{ t('tos.disputeResolution.mediation') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.governingLaw.title') }}</h3>
        <p>{{ t('tos.governingLaw.jurisdiction') }}</p>
        <p>{{ t('tos.governingLaw.venue') }}</p>
      </section>

      <section>
        <h3>{{ t('tos.miscellaneous.title') }}</h3>
        <ul>
          <li><strong>{{ t('tos.miscellaneous.severability.title') }}</strong> {{ t('tos.miscellaneous.severability.content') }}</li>
          <li><strong>{{ t('tos.miscellaneous.waiver.title') }}</strong> {{ t('tos.miscellaneous.waiver.content') }}</li>
          <li><strong>{{ t('tos.miscellaneous.assignment.title') }}</strong> {{ t('tos.miscellaneous.assignment.content') }}</li>
          <li><strong>{{ t('tos.miscellaneous.entireAgreement.title') }}</strong> {{ t('tos.miscellaneous.entireAgreement.content') }}</li>
        </ul>
      </section>

      <section>
        <h3>{{ t('tos.contact.title') }}</h3>
        <p>{{ t('tos.contact.content') }}</p>
        <p class="contact-info">
          {{ contactEmail }}
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTranslations } from '../../composables/useTranslations';
import { CONSUMER_MEDIATOR, TOS_VERSION } from '../../config/company';
import { SUPPORT_EMAIL } from '../../config/contact';

const { t, locale } = useTranslations({
  en: {
    tos: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: {date}',

      acceptance: {
        title: '1. Acceptance of Terms',
        content: 'By creating an account and using our platform, you agree to be bound by these Terms of Service, our Privacy Policy, and all applicable laws and regulations. If you do not agree with these terms, you must not access or use our services.'
      },

      description: {
        title: '2. Description of Service',
        content: 'Our platform is a Software as a Service (SaaS) that provides online course management, virtual machine access, terminal/container services, and educational resources for learning and evaluation purposes.',
        saasNature: 'As a cloud-based service, we host, maintain, and provide access to software applications and infrastructure over the Internet. You do not need to install software locally; all services are accessed through your web browser.'
      },

      userAccount: {
        title: '3. User Account and Responsibilities',
        content: 'When you create an account, you are responsible for:',
        accurate: 'Providing accurate, current, and complete information during registration',
        confidential: 'Maintaining the confidentiality and security of your account credentials',
        notify: 'Notifying us immediately of any unauthorized access or security breach',
        eligibility: 'Being at least 16 years old (or the age of digital consent in your country)',
        oneAccount: 'Creating only one account per person unless explicitly authorized otherwise'
      },

      serviceAccess: {
        title: '4. Service Access and Availability',
        intro: 'Your access to our services is subject to the following conditions:',
        revocation: 'Access to this service may be revoked at any time, for any reason, with or without prior notice',
        availability: 'We do not guarantee uninterrupted or error-free service availability',
        maintenance: 'The service may be temporarily unavailable during scheduled or emergency maintenance',
        modifications: 'We reserve the right to modify, suspend, or discontinue any feature at our sole discretion'
      },

      machineUsage: {
        title: '5. Virtual Machine and Terminal Usage',
        intro: 'When using virtual machines, containers, or terminal access:',
        logging: 'Your IP address, access time, and activity on servers and virtual machines are logged and monitored',
        monitoring: 'All commands, processes, and system interactions may be recorded for security, debugging, and compliance purposes',
        abuse: 'Any abuse of this service (including but not limited to: resource hogging, unauthorized access attempts, malicious activity) may lead to immediate account suspension, permanent ban, legal action, or other applicable measures',
        resources: 'Resource usage (CPU, memory, disk, network) is monitored and may be limited based on your subscription tier',
        isolation: 'While we implement security measures, you acknowledge that shared infrastructure carries inherent risks'
      },

      dataProtection: {
        title: '6. Data Protection and Privacy (GDPR Compliance)',
        gdprIntro: 'We are committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR) and applicable data protection laws:',
        dataCollected: {
          title: 'Personal Data Collected:',
          content: 'We collect your name, email address, username, billing information (if applicable), and account preferences.'
        },
        technicalData: {
          title: 'Technical Data Collected:',
          content: 'We collect IP addresses, access logs, terminal session logs, usage statistics, device information, and error reports necessary for service operation and security.'
        },
        purpose: {
          title: 'Purpose of Processing:',
          content: 'Your data is processed for account management, service delivery, billing, security monitoring, abuse prevention, legal compliance, and service improvement.'
        },
        legalBasis: {
          title: 'Legal Basis:',
          content: 'We process your data based on: (a) contract performance, (b) your explicit consent, (c) legitimate interests (security and fraud prevention), and (d) legal obligations.'
        },
        rights: {
          title: 'Your Rights:',
          content: 'You have the right to access, rectify, delete, port, restrict processing, and object to processing of your personal data. You may withdraw consent at any time. To exercise these rights, contact us at the email below.'
        },
        retention: {
          title: 'Data Retention:',
          content: 'We retain personal data as long as your account is active or as needed to provide services. Security logs may be retained longer for legal compliance and security purposes. You may request data deletion, subject to legal retention requirements.'
        },
        security: {
          title: 'Security:',
          content: 'We implement industry-standard technical and organizational measures including encryption, access controls, regular security audits, and employee training to protect your data.'
        },
        transfer: {
          title: 'International Data Transfer:',
          content: 'Your data may be transferred and processed in countries outside the EU. We ensure adequate protection through standard contractual clauses and compliance with applicable transfer mechanisms.'
        },
        contact: 'For data protection inquiries, to exercise your rights, or to contact our Data Protection Officer, please use the contact information provided below.'
      },

      acceptableUse: {
        title: '7. Acceptable Use Policy',
        intro: 'You agree not to use our service to:',
        illegal: 'Engage in any illegal, fraudulent, or unauthorized activities',
        harm: 'Transmit harmful, offensive, defamatory, or malicious content',
        malware: 'Upload, distribute, or execute malware, viruses, or malicious code',
        spam: 'Send unsolicited bulk emails (spam) or engage in phishing',
        mining: 'Mine cryptocurrency or perform unauthorized distributed computing',
        ddos: 'Launch denial-of-service attacks or network flooding',
        scraping: 'Perform unauthorized web scraping or data harvesting',
        interference: 'Interfere with, disrupt, or degrade the service or servers',
        unauthorized: 'Attempt to gain unauthorized access to any system, network, or data',
        reverseEngineer: 'Reverse engineer, decompile, or attempt to extract source code',
        impersonation: 'Impersonate any person or entity or misrepresent your affiliation',
        consequencesTitle: 'Consequences of Violation:',
        consequencesContent: 'Violation of this policy may result in immediate service suspension, account termination without refund, reporting to law enforcement authorities, and legal action to recover damages.'
      },

      subscriptionPayment: {
        title: '8. Subscription Plans and Payment Terms',
        intro: 'If you subscribe to a paid plan:',
        billing: {
          title: 'Billing:',
          content: 'You will be charged according to your selected subscription plan. All fees are in the currency specified at checkout. Fees already due are not refunded on cancellation, without prejudice to your right of withdrawal and to any other right the law gives you.'
        },
        renewal: {
          title: 'Automatic Renewal:',
          content: 'Subscriptions renew automatically at the end of each billing cycle unless you cancel before the renewal date. You authorize us to charge your payment method on file.'
        },
        cancellation: {
          title: 'Cancellation:',
          content: 'You may cancel your subscription at any time through your account settings or by contacting support. Cancellation takes effect at the end of the current billing period.'
        },
        refunds: {
          title: 'Refunds:',
          content: 'Outside the right of withdrawal described below and any refund the law requires, refunds are granted at our discretion, and we do not normally refund unused time on a period already started. Initiating a chargeback rather than contacting us may lead to the suspension of your account.'
        },
        priceChanges: {
          title: 'Price Changes:',
          content: 'We reserve the right to change subscription prices with at least 30 days\' advance notice. Continued use after a price change constitutes acceptance.'
        },
        taxes: {
          title: 'Taxes:',
          content: 'All fees are exclusive of applicable taxes (VAT, sales tax, etc.). You are responsible for paying all applicable taxes.'
        }
      },

      withdrawal: {
        title: '9. Right of Withdrawal',
        right: 'If you are a consumer resident in the European Union, you have fourteen (14) days from the conclusion of the contract to withdraw from a subscription, without giving any reason and without penalty.',
        immediateStart: 'Because the service is supplied digitally and immediately, you are asked at checkout to expressly request that it start during the withdrawal period, and to acknowledge that once the service has been fully performed you lose the right to withdraw. Where it has only been partly performed, you owe an amount proportionate to what was supplied before you withdrew.',
        howTo: 'To withdraw, tell us in an unambiguous statement — an email to the address in the contact section is enough. No particular form is required.',
        refund: 'We refund the sums due within fourteen (14) days of being informed, using the same payment method you used, at no cost to you.',
        professionalTitle: 'Business customers:',
        professional: 'The right of withdrawal is a consumer protection and does not apply to purchases made for professional purposes.'
      },

      intellectualProperty: {
        title: '10. Intellectual Property Rights',
        ownership: 'All content, software, trademarks, logos, and intellectual property on this platform are owned by us or our licensors. All rights are reserved.',
        license: 'We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the service for its intended purpose only. You may not copy, modify, distribute, sell, or lease any part of our services.',
        userContent: 'You retain ownership of content you create or upload ("User Content"). By uploading User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, store, and display it solely for providing the service.',
        feedback: 'Any feedback, suggestions, or ideas you provide become our property and may be used without compensation or attribution.'
      },

      thirdPartyServices: {
        title: '11. Third-Party Services and Links',
        content: 'Our service may integrate with or link to third-party services (e.g., payment processors, authentication providers). We are not responsible for the content, privacy practices, or terms of third-party services. Your use of third-party services is governed by their respective terms and policies.'
      },

      termination: {
        title: '12. Account Termination and Suspension',
        byUs: 'We may suspend or terminate your account immediately, without prior notice, if you violate these Terms, engage in prohibited activities, fail to pay fees, or if required by law. Termination does not relieve you of any obligations incurred prior to termination.',
        byYou: 'You may terminate your account at any time through your account settings. Upon termination, you must cease all use of the service.',
        effects: 'Upon termination by either party: (a) your access will be immediately revoked, (b) your data may be deleted after a grace period, (c) no refunds will be issued for prepaid fees, and (d) all licenses granted to you will immediately terminate.'
      },

      warranties: {
        title: '13. Disclaimer of Warranties',
        disclaimer: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, OR NON-INFRINGEMENT.',
        availability: 'We do not warrant that the service will be uninterrupted, secure, or error-free, or that defects will be corrected. You use the service at your own risk.'
      },

      liability: {
        title: '14. Limitation of Liability',
        limitation: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.',
        exclusions: 'Our total liability for all claims related to the service shall not exceed the amount you paid us in the 12 months preceding the claim, or €100, whichever is greater.',
        indemnification: 'You agree to indemnify, defend, and hold us harmless from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the service, violation of these Terms, or infringement of any rights of others.'
      },

      dataBackup: {
        title: '15. Data Backup and Loss',
        responsibility: 'You are solely responsible for backing up any data, files, or content you create or store on our service. We strongly recommend maintaining regular backups.',
        noGuarantee: 'While we implement backup procedures, we do not guarantee data recovery in case of data loss, corruption, deletion, or service interruption. We are not liable for any data loss.'
      },

      modifications: {
        title: '16. Modifications to Terms',
        right: 'We reserve the right to modify, update, or replace these Terms of Service at any time at our sole discretion.',
        notification: 'We will notify you of significant changes via email or by posting a notice on our website at least 30 days before the effective date.',
        acceptance: 'Continued use of the service after changes become effective constitutes your acceptance of the modified Terms. If you do not agree to the changes, you must stop using the service and may terminate your account.'
      },

      disputeResolution: {
        title: '17. Dispute Resolution',
        negotiation: 'In the event of any dispute arising from these Terms, you agree to first attempt to resolve the issue through good-faith negotiation with us.',
        mediation: 'If negotiation fails, disputes may be submitted to mediation before pursuing litigation, unless prohibited by applicable law.',
        consumerMediation: 'If you are a consumer and our reply does not satisfy you, you may refer the dispute free of charge to the consumer mediator below, within one year of your written complaint. You may also use the European Online Dispute Resolution platform.'
      },

      governingLaw: {
        title: '18. Governing Law and Jurisdiction',
        jurisdiction: 'These Terms are governed by French law, together with the directly applicable law of the European Union. If you are a consumer resident in another EU member state, you also keep the protection of the mandatory provisions of your country of residence.',
        venue: 'For business customers, any dispute arising from these Terms shall be brought before the courts of Toulouse, France. If you are a consumer, you may bring proceedings before the court of the place where you were domiciled when the contract was concluded or where the harmful event occurred, and we may only sue you before the courts of your place of residence.'
      },

      miscellaneous: {
        title: '19. Miscellaneous Provisions',
        severability: {
          title: 'Severability:',
          content: 'If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.'
        },
        waiver: {
          title: 'Waiver:',
          content: 'Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.'
        },
        assignment: {
          title: 'Assignment:',
          content: 'You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.'
        },
        entireAgreement: {
          title: 'Entire Agreement:',
          content: 'These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding the service and supersede all prior agreements.'
        }
      },

      contact: {
        title: '20. Contact Information',
        content: 'For questions about these Terms of Service, to exercise your GDPR rights, or to report violations, please contact us at:'
      }
    }
  },
  fr: {
    tos: {
      title: 'Conditions Générales d\'Utilisation',
      lastUpdated: 'Dernière mise à jour : {date}',

      acceptance: {
        title: '1. Acceptation des Conditions',
        content: 'En créant un compte et en utilisant notre plateforme, vous acceptez d\'être lié par ces Conditions Générales d\'Utilisation, notre Politique de Confidentialité et toutes les lois et réglementations applicables. Si vous n\'acceptez pas ces conditions, vous ne devez pas accéder ou utiliser nos services.'
      },

      description: {
        title: '2. Description du Service',
        content: 'Notre plateforme est un logiciel en tant que service (SaaS) qui fournit la gestion de cours en ligne, l\'accès aux machines virtuelles, des services de terminaux/conteneurs et des ressources pédagogiques à des fins d\'apprentissage et d\'évaluation.',
        saasNature: 'En tant que service cloud, nous hébergeons, maintenons et donnons accès à des applications logicielles et à des infrastructures via Internet. Vous n\'avez pas besoin d\'installer de logiciel localement ; tous les services sont accessibles via votre navigateur web.'
      },

      userAccount: {
        title: '3. Compte Utilisateur et Responsabilités',
        content: 'Lorsque vous créez un compte, vous êtes responsable de :',
        accurate: 'Fournir des informations exactes, à jour et complètes lors de l\'inscription',
        confidential: 'Maintenir la confidentialité et la sécurité de vos identifiants de compte',
        notify: 'Nous informer immédiatement de tout accès non autorisé ou violation de sécurité',
        eligibility: 'Avoir au moins 16 ans (ou l\'âge du consentement numérique dans votre pays)',
        oneAccount: 'Ne créer qu\'un seul compte par personne sauf autorisation explicite contraire'
      },

      serviceAccess: {
        title: '4. Accès et Disponibilité du Service',
        intro: 'Votre accès à nos services est soumis aux conditions suivantes :',
        revocation: 'L\'accès à ce service peut être révoqué à tout moment, pour quelque raison que ce soit, avec ou sans préavis',
        availability: 'Nous ne garantissons pas une disponibilité de service ininterrompue ou sans erreur',
        maintenance: 'Le service peut être temporairement indisponible pendant une maintenance programmée ou d\'urgence',
        modifications: 'Nous nous réservons le droit de modifier, suspendre ou interrompre toute fonctionnalité à notre seule discrétion'
      },

      machineUsage: {
        title: '5. Utilisation des Machines Virtuelles et Terminaux',
        intro: 'Lors de l\'utilisation de machines virtuelles, conteneurs ou accès terminal :',
        logging: 'Votre adresse IP, l\'heure d\'accès et l\'activité sur les serveurs et machines virtuelles sont enregistrés et surveillés',
        monitoring: 'Toutes les commandes, processus et interactions système peuvent être enregistrés à des fins de sécurité, de débogage et de conformité',
        abuse: 'Tout abus de ce service (y compris mais sans s\'y limiter : monopolisation des ressources, tentatives d\'accès non autorisé, activité malveillante) peut entraîner une suspension immédiate du compte, une interdiction permanente, des poursuites judiciaires ou d\'autres mesures applicables',
        resources: 'L\'utilisation des ressources (CPU, mémoire, disque, réseau) est surveillée et peut être limitée selon votre niveau d\'abonnement',
        isolation: 'Bien que nous mettions en œuvre des mesures de sécurité, vous reconnaissez que l\'infrastructure partagée comporte des risques inhérents',
        warningTitle: 'Avertissement Important :',
        warningContent: 'Toute activité malveillante, tentative de piratage ou violation de sécurité sera signalée aux autorités compétentes et pourra faire l\'objet de poursuites judiciaires.'
      },

      dataProtection: {
        title: '6. Protection des Données et Confidentialité (Conformité RGPD)',
        gdprIntro: 'Nous nous engageons à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et aux lois applicables en matière de protection des données :',
        dataCollected: {
          title: 'Données Personnelles Collectées :',
          content: 'Nous collectons vos nom, adresse email, nom d\'utilisateur, informations de facturation (le cas échéant) et préférences de compte.'
        },
        technicalData: {
          title: 'Données Techniques Collectées :',
          content: 'Nous collectons les adresses IP, journaux d\'accès, journaux de sessions terminal, statistiques d\'utilisation, informations sur l\'appareil et rapports d\'erreur nécessaires au fonctionnement et à la sécurité du service.'
        },
        purpose: {
          title: 'Finalité du Traitement :',
          content: 'Vos données sont traitées pour la gestion de compte, la fourniture du service, la facturation, la surveillance de sécurité, la prévention des abus, la conformité légale et l\'amélioration du service.'
        },
        legalBasis: {
          title: 'Base Légale :',
          content: 'Nous traitons vos données sur la base de : (a) l\'exécution du contrat, (b) votre consentement explicite, (c) nos intérêts légitimes (sécurité et prévention de la fraude), et (d) nos obligations légales.'
        },
        rights: {
          title: 'Vos Droits :',
          content: 'Vous avez le droit d\'accéder, de rectifier, d\'effacer, de porter, de limiter le traitement et de vous opposer au traitement de vos données personnelles. Vous pouvez retirer votre consentement à tout moment. Pour exercer ces droits, contactez-nous à l\'adresse ci-dessous.'
        },
        retention: {
          title: 'Conservation des Données :',
          content: 'Nous conservons les données personnelles tant que votre compte est actif ou selon les besoins pour fournir les services. Les journaux de sécurité peuvent être conservés plus longtemps pour la conformité légale et les besoins de sécurité. Vous pouvez demander la suppression des données, sous réserve des obligations légales de conservation.'
        },
        security: {
          title: 'Sécurité :',
          content: 'Nous mettons en œuvre des mesures techniques et organisationnelles conformes aux normes de l\'industrie, notamment le chiffrement, les contrôles d\'accès, des audits de sécurité réguliers et la formation des employés pour protéger vos données.'
        },
        transfer: {
          title: 'Transfert International de Données :',
          content: 'Vos données peuvent être transférées et traitées dans des pays en dehors de l\'UE. Nous assurons une protection adéquate par le biais de clauses contractuelles types et de conformité aux mécanismes de transfert applicables.'
        },
        contact: 'Pour les demandes relatives à la protection des données, pour exercer vos droits ou pour contacter notre Délégué à la Protection des Données, veuillez utiliser les coordonnées fournies ci-dessous.'
      },

      acceptableUse: {
        title: '7. Politique d\'Utilisation Acceptable',
        intro: 'Vous acceptez de ne pas utiliser notre service pour :',
        illegal: 'Vous engager dans des activités illégales, frauduleuses ou non autorisées',
        harm: 'Transmettre du contenu nuisible, offensant, diffamatoire ou malveillant',
        malware: 'Télécharger, distribuer ou exécuter des logiciels malveillants, virus ou code malveillant',
        spam: 'Envoyer des emails massifs non sollicités (spam) ou participer au phishing',
        mining: 'Miner des cryptomonnaies ou effectuer du calcul distribué non autorisé',
        ddos: 'Lancer des attaques par déni de service ou inondation de réseau',
        scraping: 'Effectuer du web scraping ou de la collecte de données non autorisée',
        interference: 'Interférer avec, perturber ou dégrader le service ou les serveurs',
        unauthorized: 'Tenter d\'obtenir un accès non autorisé à tout système, réseau ou données',
        reverseEngineer: 'Faire de l\'ingénierie inverse, décompiler ou tenter d\'extraire le code source',
        impersonation: 'Usurper l\'identité d\'une personne ou d\'une entité ou présenter faussement votre affiliation',
        consequencesTitle: 'Conséquences de la Violation :',
        consequencesContent: 'La violation de cette politique peut entraîner une suspension immédiate du service, une résiliation du compte sans remboursement, un signalement aux autorités et des poursuites judiciaires pour récupérer les dommages.'
      },

      subscriptionPayment: {
        title: '8. Abonnements et Conditions de Paiement',
        intro: 'Si vous souscrivez à un plan payant :',
        billing: {
          title: 'Facturation :',
          content: 'Vous serez facturé selon le plan d\'abonnement sélectionné. Tous les frais sont dans la devise spécifiée lors du paiement et ne sont pas remboursables sauf exigence légale.'
        },
        renewal: {
          title: 'Renouvellement Automatique :',
          content: 'Les abonnements se renouvellent automatiquement à la fin de chaque période de facturation sauf si vous annulez avant la date de renouvellement. Vous nous autorisez à débiter votre moyen de paiement enregistré.'
        },
        cancellation: {
          title: 'Annulation :',
          content: 'Vous pouvez annuler votre abonnement à tout moment via les paramètres de votre compte ou en contactant le support. L\'annulation prend effet à la fin de la période de facturation en cours.'
        },
        refunds: {
          title: 'Remboursements :',
          content: 'Les remboursements sont accordés à notre seule discrétion. Les remboursements partiels pour le temps non utilisé ne sont généralement pas fournis. Les rétrofacturations peuvent entraîner une résiliation immédiate du compte.'
        },
        priceChanges: {
          title: 'Changements de Prix :',
          content: 'Nous nous réservons le droit de modifier les prix d\'abonnement avec un préavis d\'au moins 30 jours. L\'utilisation continue après un changement de prix constitue une acceptation.'
        },
        taxes: {
          title: 'Taxes :',
          content: 'Tous les frais sont hors taxes applicables (TVA, taxe de vente, etc.). Vous êtes responsable du paiement de toutes les taxes applicables.'
        }
      },

      withdrawal: {
        title: '9. Droit de Rétractation',
        right: 'Si vous êtes un consommateur résidant dans l\'Union Européenne, vous disposez de quatorze (14) jours à compter de la conclusion du contrat pour vous rétracter d\'un abonnement, sans avoir à motiver votre décision et sans pénalité.',
        immediateStart: 'Le service étant fourni sous forme numérique et de manière immédiate, il vous est demandé lors du paiement de demander expressément que son exécution commence pendant le délai de rétractation, et de reconnaître que vous perdez ce droit une fois le service pleinement exécuté. S\'il n\'a été que partiellement exécuté, vous restez redevable d\'un montant proportionnel à ce qui vous a été fourni avant votre rétractation.',
        howTo: 'Pour vous rétracter, il suffit de nous adresser une déclaration dénuée d\'ambiguïté — un courriel à l\'adresse figurant dans la section Contact suffit. Aucune forme particulière n\'est exigée.',
        refund: 'Nous vous remboursons les sommes dues dans les quatorze (14) jours suivant la réception de votre décision, par le même moyen de paiement que celui utilisé, sans frais pour vous.',
        professionalTitle: 'Clients professionnels :',
        professional: 'Le droit de rétractation est une protection du consommateur : il ne s\'applique pas aux achats effectués à des fins professionnelles.'
      },

      intellectualProperty: {
        title: '10. Droits de Propriété Intellectuelle',
        ownership: 'Tout le contenu, les logiciels, les marques, les logos et la propriété intellectuelle de cette plateforme nous appartiennent ou appartiennent à nos concédants de licence. Tous les droits sont réservés.',
        license: 'Nous vous accordons une licence limitée, non exclusive, non transférable et révocable pour accéder et utiliser le service uniquement aux fins prévues. Vous ne pouvez pas copier, modifier, distribuer, vendre ou louer toute partie de nos services.',
        userContent: 'Vous conservez la propriété du contenu que vous créez ou téléchargez ("Contenu Utilisateur"). En téléchargeant du Contenu Utilisateur, vous nous accordez une licence mondiale, non exclusive et gratuite pour l\'utiliser, le stocker et l\'afficher uniquement dans le but de fournir le service.',
        feedback: 'Tout commentaire, suggestion ou idée que vous fournissez devient notre propriété et peut être utilisé sans compensation ni attribution.'
      },

      thirdPartyServices: {
        title: '11. Services et Liens Tiers',
        content: 'Notre service peut s\'intégrer ou renvoyer vers des services tiers (par ex., processeurs de paiement, fournisseurs d\'authentification). Nous ne sommes pas responsables du contenu, des pratiques de confidentialité ou des conditions des services tiers. Votre utilisation des services tiers est régie par leurs conditions et politiques respectives.'
      },

      termination: {
        title: '12. Résiliation et Suspension du Compte',
        byUs: 'Nous pouvons suspendre ou résilier votre compte immédiatement, sans préavis, si vous violez ces Conditions, participez à des activités interdites, ne payez pas les frais ou si requis par la loi. La résiliation ne vous dégage pas des obligations contractées avant la résiliation.',
        byYou: 'Vous pouvez résilier votre compte à tout moment via les paramètres de votre compte. Lors de la résiliation, vous devez cesser toute utilisation du service.',
        effects: 'Lors de la résiliation par l\'une ou l\'autre partie : (a) votre accès sera immédiatement révoqué, (b) vos données peuvent être supprimées après un délai de grâce, (c) aucun remboursement ne sera émis pour les frais prépayés, et (d) toutes les licences qui vous ont été accordées prendront fin immédiatement.'
      },

      warranties: {
        title: '13. Exclusion de Garanties',
        disclaimer: 'LE SERVICE EST FOURNI "TEL QUEL" ET "SELON DISPONIBILITÉ" SANS GARANTIE D\'AUCUNE SORTE, EXPRESSE OU IMPLICITE, Y COMPRIS MAIS SANS S\'Y LIMITER LES GARANTIES DE QUALITÉ MARCHANDE, D\'ADÉQUATION À UN USAGE PARTICULIER, DE TITRE OU DE NON-CONTREFAÇON.',
        availability: 'Nous ne garantissons pas que le service sera ininterrompu, sécurisé ou sans erreur, ou que les défauts seront corrigés. Vous utilisez le service à vos propres risques.'
      },

      liability: {
        title: '14. Limitation de Responsabilité',
        limitation: 'DANS LA MESURE MAXIMALE AUTORISÉE PAR LA LOI, NOUS NE SERONS PAS RESPONSABLES DES DOMMAGES INDIRECTS, ACCESSOIRES, SPÉCIAUX, CONSÉCUTIFS OU PUNITIFS, Y COMPRIS MAIS SANS S\'Y LIMITER LA PERTE DE PROFITS, DE DONNÉES, D\'UTILISATION OU DE GOODWILL, DÉCOULANT DE VOTRE UTILISATION OU DE VOTRE INCAPACITÉ À UTILISER LE SERVICE.',
        exclusions: 'Notre responsabilité totale pour toutes les réclamations liées au service ne dépassera pas le montant que vous nous avez payé au cours des 12 mois précédant la réclamation, ou 100 €, selon le montant le plus élevé.',
        indemnification: 'Vous acceptez d\'indemniser, de défendre et de nous dégager de toute responsabilité pour toutes réclamations, dommages, pertes, responsabilités et dépenses (y compris les frais juridiques) découlant de votre utilisation du service, de la violation de ces Conditions ou de la violation des droits d\'autrui.'
      },

      dataBackup: {
        title: '15. Sauvegarde et Perte de Données',
        responsibility: 'Vous êtes seul responsable de la sauvegarde de toutes les données, fichiers ou contenus que vous créez ou stockez sur notre service. Nous recommandons fortement de maintenir des sauvegardes régulières.',
        noGuarantee: 'Bien que nous mettions en œuvre des procédures de sauvegarde, nous ne garantissons pas la récupération des données en cas de perte, corruption, suppression ou interruption de service. Nous ne sommes pas responsables de toute perte de données.'
      },

      modifications: {
        title: '16. Modifications des Conditions',
        right: 'Nous nous réservons le droit de modifier, mettre à jour ou remplacer ces Conditions Générales d\'Utilisation à tout moment à notre seule discrétion.',
        notification: 'Nous vous informerons des modifications importantes par email ou en publiant un avis sur notre site web au moins 30 jours avant la date d\'entrée en vigueur.',
        acceptance: 'L\'utilisation continue du service après l\'entrée en vigueur des modifications constitue votre acceptation des Conditions modifiées. Si vous n\'acceptez pas les modifications, vous devez cesser d\'utiliser le service et pouvez résilier votre compte.'
      },

      disputeResolution: {
        title: '17. Résolution des Litiges',
        negotiation: 'En cas de litige découlant de ces Conditions, vous acceptez de tenter d\'abord de résoudre le problème par une négociation de bonne foi avec nous.',
        mediation: 'Si la négociation échoue, les litiges peuvent être soumis à la médiation avant toute action judiciaire, sauf interdiction par la loi applicable.',
        consumerMediation: 'Si vous êtes un consommateur et que notre réponse ne vous satisfait pas, vous pouvez saisir gratuitement le médiateur de la consommation ci-dessous, dans un délai d\'un an à compter de votre réclamation écrite. Vous pouvez également recourir à la plateforme européenne de règlement en ligne des litiges.'
      },

      governingLaw: {
        title: '18. Droit Applicable et Juridiction',
        jurisdiction: 'Les présentes Conditions sont régies par le droit français, ainsi que par le droit de l\'Union Européenne directement applicable. Si vous êtes un consommateur résidant dans un autre État membre de l\'Union, vous conservez le bénéfice des dispositions impératives de votre pays de résidence.',
        venue: 'Pour les clients professionnels, tout litige né des présentes Conditions sera porté devant les tribunaux de Toulouse. Si vous êtes un consommateur, vous pouvez saisir la juridiction du lieu où vous demeuriez lors de la conclusion du contrat ou du lieu de survenance du fait dommageable, et nous ne pouvons vous assigner que devant la juridiction de votre lieu de résidence.'
      },

      miscellaneous: {
        title: '19. Dispositions Diverses',
        severability: {
          title: 'Divisibilité :',
          content: 'Si une disposition de ces Conditions est jugée invalide ou inapplicable, les dispositions restantes resteront pleinement en vigueur.'
        },
        waiver: {
          title: 'Renonciation :',
          content: 'Notre défaut d\'exercer un droit ou une disposition de ces Conditions ne constitue pas une renonciation à ce droit ou à cette disposition.'
        },
        assignment: {
          title: 'Cession :',
          content: 'Vous ne pouvez pas céder ou transférer ces Conditions ou votre compte sans notre consentement écrit préalable. Nous pouvons céder ces Conditions sans restriction.'
        },
        entireAgreement: {
          title: 'Intégralité de l\'Accord :',
          content: 'Ces Conditions, ainsi que notre Politique de Confidentialité, constituent l\'intégralité de l\'accord entre vous et nous concernant le service et remplacent tous les accords antérieurs.'
        }
      },

      contact: {
        title: '20. Informations de Contact',
        content: 'Pour toute question concernant ces Conditions Générales d\'Utilisation, pour exercer vos droits RGPD ou pour signaler des violations, veuillez nous contacter à :'
      }
    }
  }
})

// The displayed date IS the accepted version: two literals meant the page could
// advertise one date while signups were stamped with another.
const lastUpdateDate = computed(() => {
  const date = new Date(TOS_VERSION);
  return date.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const contactEmail = SUPPORT_EMAIL;

const mediator = CONSUMER_MEDIATOR;
const mediatorContact = computed(() =>
  [mediator.name, mediator.address, mediator.website].filter(Boolean).join(' — ')
);
</script>

<style scoped>
.terms-of-service {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.terms-header {
  margin-bottom: 32px;
  text-align: center;
}

.terms-header h2 {
  font-size: 2rem;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.last-updated {
  color: var(--color-gray-600);
  font-size: 0.9rem;
  font-style: italic;
}

.terms-content {
  line-height: 1.6;
  color: var(--color-text-primary);
}

.terms-content section {
  margin-bottom: 32px;
}

.terms-content h3 {
  font-size: 1.3rem;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.terms-content p {
  margin-bottom: 12px;
}

.terms-content ul {
  margin-left: 20px;
  margin-bottom: 12px;
}

.terms-content li {
  margin-bottom: 8px;
}

.contact-info {
  font-weight: 600;
  color: var(--color-primary);
}
</style>
