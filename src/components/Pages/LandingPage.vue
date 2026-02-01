<template>
  <div class="landing-page">
    <!-- Floating Navigation -->
    <nav class="floating-nav" :class="{ 'visible': showNav }">
      <div class="nav-container">
        <a href="#hero" class="nav-link" @click.prevent="scrollToSection('hero')">
          <i class="fas fa-home"></i>
          <span>{{ t('landing.nav.home') }}</span>
        </a>
        <a href="#features" class="nav-link" @click.prevent="scrollToSection('features')">
          <i class="fas fa-star"></i>
          <span>{{ t('landing.nav.features') }}</span>
        </a>
        <a href="#use-cases" class="nav-link" @click.prevent="scrollToSection('use-cases')">
          <i class="fas fa-users"></i>
          <span>{{ t('landing.nav.useCases') }}</span>
        </a>
        <a href="#contact" class="nav-link" @click.prevent="scrollToSection('contact')">
          <i class="fas fa-envelope"></i>
          <span>{{ t('landing.nav.contact') }}</span>
        </a>
      </div>
    </nav>

    <!-- Hero Section with Terminal Theme -->
    <header id="hero" class="hero-section">
      <!-- Animated terminal grid background -->
      <div class="terminal-grid"></div>
      <div class="scanline"></div>

      <div class="hero-content">
        <!-- Terminal-style badge -->
        <div class="terminal-prompt">
          <span class="prompt-char">$</span>
          <span class="typing-text">{{ t('landing.promptText') }}</span>
          <span class="cursor">_</span>
        </div>

        <h1 class="hero-title">
          {{ t('landing.heroTitle') }}
        </h1>

        <div class="cta-buttons">
          <router-link to="/register" class="btn btn-primary">
            <span class="btn-icon">›</span>
            <span>{{ t('landing.startLearning') }}</span>
          </router-link>
          <router-link to="/login" class="btn btn-secondary">
            {{ t('landing.login') }}
          </router-link>
          <router-link to="/help-public" class="btn btn-ghost">
            {{ t('landing.learnMore') }}
          </router-link>
        </div>

        <p class="hero-subtitle">{{ t('landing.heroSubtitle') }}</p>

        <!-- Simulated terminal snippet -->
        <div class="terminal-demo">
          <div class="terminal-header">
            <span class="terminal-user">user@opencourse-factory</span>
          </div>
          <div class="terminal-body">
            <div class="terminal-line">
              <span class="prompt">$</span>
              <span class="command">{{ t('landing.demo.command1') }}</span>
            </div>
            <div class="terminal-line output">{{ t('landing.demo.output1') }}</div>
            <div class="terminal-line">
              <span class="prompt">$</span>
              <span class="command">{{ t('landing.demo.command2') }}</span>
              <span class="cursor-static">_</span>
            </div>
          </div>
        </div>

        <!-- Trust indicators -->
        <div class="trust-badges">
          <div class="badge-item">
            <div class="badge-number">15min</div>
            <div class="badge-label">{{ t('landing.badges.sessionReset') }}</div>
          </div>
          <div class="badge-item">
            <div class="badge-number">100%</div>
            <div class="badge-label">{{ t('landing.badges.isolated') }}</div>
          </div>
          <div class="badge-item">
            <div class="badge-number">0</div>
            <div class="badge-label">{{ t('landing.badges.installation') }}</div>
          </div>
        </div>
      </div>
    </header>

    <!-- Learning Features Section -->
    <section id="features" class="learning-features">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">{{ t('landing.learning.title') }}</h2>
          <p class="section-description">{{ t('landing.learning.subtitle') }}</p>
        </div>

        <div class="features-grid">
          <!-- Feature 1: Safe Practice Environment -->
          <div class="feature-card" style="--card-delay: 0.1s">
            <h3 class="feature-title">
              <span class="feature-icon">🛡️</span>
              {{ t('landing.learning.safe.title') }}
            </h3>
            <p class="feature-desc">{{ t('landing.learning.safe.description') }}</p>
            <ul class="feature-benefits">
              <li>{{ t('landing.learning.safe.benefit1') }}</li>
              <li>{{ t('landing.learning.safe.benefit2') }}</li>
              <li>{{ t('landing.learning.safe.benefit3') }}</li>
            </ul>
          </div>

          <!-- Feature 2: Real Linux -->
          <div class="feature-card" style="--card-delay: 0.2s">
            <h3 class="feature-title">
              <span class="feature-icon">💻</span>
              {{ t('landing.learning.realLinux.title') }}
            </h3>
            <p class="feature-desc">{{ t('landing.learning.realLinux.description') }}</p>
            <ul class="feature-benefits">
              <li>{{ t('landing.learning.realLinux.benefit1') }}</li>
              <li>{{ t('landing.learning.realLinux.benefit2') }}</li>
              <li>{{ t('landing.learning.realLinux.benefit3') }}</li>
            </ul>
          </div>

          <!-- Feature 3: Instant Access -->
          <div class="feature-card" style="--card-delay: 0.3s">
            <h3 class="feature-title">
              <span class="feature-icon">⚡</span>
              {{ t('landing.learning.instant.title') }}
            </h3>
            <p class="feature-desc">{{ t('landing.learning.instant.description') }}</p>
            <ul class="feature-benefits">
              <li>{{ t('landing.learning.instant.benefit1') }}</li>
              <li>{{ t('landing.learning.instant.benefit2') }}</li>
              <li>{{ t('landing.learning.instant.benefit3') }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="how-it-works">
      <div class="container">
        <h2 class="section-title">{{ t('landing.howItWorks.title') }}</h2>

        <div class="workflow">
          <div class="workflow-step" v-for="index in 3" :key="index">
            <div class="step-visual">
              <div class="step-number">{{ index }}</div>
              <div class="step-connector" v-if="index < 3"></div>
            </div>
            <div class="step-content">
              <h3>{{ t(`landing.howItWorks.step${index}.title`) }}</h3>
              <p>{{ t(`landing.howItWorks.step${index}.description`) }}</p>
            </div>
          </div>
        </div>

        <div class="cta-centered">
          <router-link to="/register" class="btn btn-primary btn-large">
            {{ t('landing.readyToStart') }}
          </router-link>
        </div>
      </div>
    </section>

    <!-- Use Cases -->
    <section id="use-cases" class="use-cases">
      <div class="container">
        <h2 class="section-title">{{ t('landing.useCases.title') }}</h2>

        <div class="use-case-grid">
          <div class="use-case-card">
            <div class="use-case-icon">🎓</div>
            <h3>{{ t('landing.useCases.students.title') }}</h3>
            <p>{{ t('landing.useCases.students.description') }}</p>
          </div>

          <div class="use-case-card">
            <div class="use-case-icon">👨‍🏫</div>
            <h3>{{ t('landing.useCases.educators.title') }}</h3>
            <p>{{ t('landing.useCases.educators.description') }}</p>
          </div>

          <div class="use-case-card">
            <div class="use-case-icon">👨‍💻</div>
            <h3>{{ t('landing.useCases.developers.title') }}</h3>
            <p>{{ t('landing.useCases.developers.description') }}</p>
          </div>

          <div class="use-case-card">
            <div class="use-case-icon">🔬</div>
            <h3>{{ t('landing.useCases.testers.title') }}</h3>
            <p>{{ t('landing.useCases.testers.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer id="contact" class="footer-section">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>Open Course Factory</h3>
            <p>{{ t('landing.footer.description') }}</p>
            <p class="footer-contact">
              <i class="fas fa-envelope"></i>
              <a href="mailto:contact@labinux.com">contact@labinux.com</a>
            </p>
          </div>

          <div class="footer-links">
            <div class="link-group">
              <h4>{{ t('landing.footer.platform') }}</h4>
              <router-link to="/help-public">{{ t('landing.footer.documentation') }}</router-link>
              <a href="https://usine.solution-libre.fr/open-course-factory/" target="_blank" rel="noopener noreferrer">
                {{ t('landing.footer.gitlab') }}
              </a>
              <router-link to="/legal">{{ t('landing.footer.legal') }}</router-link>
            </div>

            <div class="link-group">
              <h4>{{ t('landing.footer.resources') }}</h4>
              <router-link to="/help-public/terminals/getting-started">{{ t('landing.footer.gettingStarted') }}</router-link>
              <router-link to="/help-public/terminals/troubleshooting">{{ t('landing.footer.troubleshooting') }}</router-link>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="footer-left">
            <p>&copy; 2023-2025 Solution Libre. {{ t('landing.footer.rights') }}</p>
            <div class="version-info">
              <AlphaBadge size="large" />
              <span class="version-divider">•</span>
              <span class="version-item">Frontend: v{{ versions.frontend }}</span>
              <span class="version-divider">•</span>
              <span class="version-item">API: v{{ versions.api }}</span>
              <span class="version-divider">•</span>
              <span class="version-item">Terminal Trainer: v{{ versions.terminalTrainer }}</span>
            </div>
          </div>
          <div class="footer-language">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useVersionInfo } from '../../composables/useVersionInfo'
import AlphaBadge from '../Common/AlphaBadge.vue'
import LanguageSelector from '../UI/LanguageSelector.vue'

// State for floating nav visibility
const showNav = ref(false)
let rafId: number | null = null

// Check scroll position continuously
function checkScroll() {
  const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
  showNav.value = scrollY > 300

  // Continue checking
  rafId = requestAnimationFrame(checkScroll)
}

// Smooth scroll to section
function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
    // Update URL hash
    window.history.pushState(null, '', `#${sectionId}`)
  }
}

// Setup continuous scroll monitoring
onMounted(() => {
  // Start continuous scroll checking
  rafId = requestAnimationFrame(checkScroll)

  // Check if there's a hash in URL on mount
  if (window.location.hash) {
    const sectionId = window.location.hash.substring(1)
    // Delay to ensure page is loaded
    setTimeout(() => {
      scrollToSection(sectionId)
    }, 100)
  }
})

onBeforeUnmount(() => {
  // Stop scroll checking
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
})

const { t } = useTranslations({
  en: {
    landing: {
      promptText: 'initializing learning environment...',
      nav: {
        home: 'Home',
        features: 'Features',
        useCases: 'Use Cases',
        contact: 'Contact'
      },
      heroTitle: 'Learn Linux, Docker, Kubernetes & More—Right in Your Browser',
      heroSubtitle: 'Hands-on training for DevOps technologies without breaking anything. Practice Linux, Docker, GitLab, Kubernetes, and other essential tools in safe, isolated environments that reset automatically.',
      terminalTitle: 'terminal — bash',
      demo: {
        command1: 'docker ps -a',
        output1: 'CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS\nabc123def456   nginx     "nginx"   2m ago    Up 2m',
        command2: 'kubectl get pods'
      },
      startLearning: 'Start Learning Free',
      login: 'Sign In',
      learnMore: 'View Documentation',
      badges: {
        sessionReset: 'Auto-reset sessions',
        isolated: 'Isolated & safe',
        installation: 'Setup required'
      },

      learning: {
        title: 'Master DevOps Technologies Through Practice',
        subtitle: 'Everything runs in your browser. Experiment freely with real tools in safe, ephemeral environments.',
        safe: {
          title: 'Experiment Without Breaking Anything',
          description: 'Isolated environments reset every 15 minutes. Try risky commands, test configurations, make mistakes—your system stays perfectly safe.',
          benefit1: 'Fully isolated containers',
          benefit2: 'Zero risk to your machine',
          benefit3: 'Fresh environment on demand'
        },
        realLinux: {
          title: 'Real Tools, Real Technologies',
          description: 'Learn Linux, Docker, Kubernetes, GitLab CI/CD, and more. Not simulators—actual production tools running in the cloud.',
          benefit1: 'Linux (Alpine, Debian, Ubuntu)',
          benefit2: 'Docker & Kubernetes',
          benefit3: 'GitLab, CI/CD & DevOps tools'
        },
        instant: {
          title: 'Zero Setup, Browser-Based',
          description: 'No installations, no virtual machines, no SSH keys. Launch a terminal in seconds and start learning immediately.',
          benefit1: 'Works in any modern browser',
          benefit2: 'No downloads or installations',
          benefit3: 'Access from anywhere, anytime'
        }
      },

      howItWorks: {
        title: 'Start Learning in 3 Simple Steps',
        step1: {
          title: 'Create Your Free Account',
          description: 'Sign up in seconds—no credit card required, no commitments'
        },
        step2: {
          title: 'Create Your Terminal',
          description: 'Choose your Linux distribution (Alpine, Debian, Ubuntu) and launch a real terminal instantly. Templates with pre-installed tools coming soon!'
        },
        step3: {
          title: 'Learn & Experiment',
          description: 'Practice in real terminals, run actual commands, break things safely—reset and try again anytime'
        }
      },

      readyToStart: 'Start Your Learning Journey',

      useCases: {
        title: 'Built for Learners and Educators',
        students: {
          title: 'Students',
          description: 'Learn Linux, Docker, and Kubernetes without complex setup. Practice DevOps skills safely before using them in production.'
        },
        educators: {
          title: 'Educators & Trainers',
          description: 'Deliver hands-on courses with zero infrastructure setup. Students get consistent environments for Linux, Docker, GitLab, and more.'
        },
        developers: {
          title: 'Developers',
          description: 'Test Docker containers, Kubernetes configs, and scripts quickly in clean environments that reset automatically.'
        },
        testers: {
          title: 'DevOps Engineers',
          description: 'Experiment with GitLab CI/CD, infrastructure tools, and automation scripts in safe sandboxes that mirror production.'
        }
      },

      footer: {
        description: 'Open Course Factory provides browser-based terminals for hands-on DevOps learning. Practice Linux, Docker, Kubernetes, GitLab, and more—safely and instantly.',
        platform: 'Platform',
        documentation: 'Documentation',
        gitlab: 'GitLab Repository',
        legal: 'Legal Notices',
        resources: 'Learning Resources',
        gettingStarted: 'Getting Started Guide',
        troubleshooting: 'Troubleshooting',
        rights: 'All rights reserved'
      }
    }
  },
  fr: {
    landing: {
      promptText: 'initialisation environnement d\'apprentissage...',
      nav: {
        home: 'Accueil',
        features: 'Fonctionnalités',
        useCases: 'Cas d\'usage',
        contact: 'Contact'
      },
      heroTitle: 'Apprenez Linux, Docker, Kubernetes & Plus—Dans Votre Navigateur',
      heroSubtitle: 'Formation pratique aux technologies DevOps sans rien casser. Pratiquez Linux, Docker, GitLab, Kubernetes et d\'autres outils essentiels dans des environnements sûrs et isolés qui se réinitialisent automatiquement.',
      terminalTitle: 'terminal — bash',
      demo: {
        command1: 'docker ps -a',
        output1: 'CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS\nabc123def456   nginx     "nginx"   2m ago    Up 2m',
        command2: 'kubectl get pods'
      },
      startLearning: 'Commencer Gratuitement',
      login: 'Se connecter',
      learnMore: 'Voir la documentation',
      badges: {
        sessionReset: 'Sessions auto-reset',
        isolated: 'Isolé & sûr',
        installation: 'Installation requise'
      },

      learning: {
        title: 'Maîtrisez les Technologies DevOps par la Pratique',
        subtitle: 'Tout fonctionne dans votre navigateur. Expérimentez librement avec de vrais outils dans des environnements sûrs et éphémères.',
        safe: {
          title: 'Expérimentez Sans Rien Casser',
          description: 'Environnements isolés qui se réinitialisent toutes les 15 minutes. Essayez des commandes risquées, testez des configurations, faites des erreurs—votre système reste parfaitement sûr.',
          benefit1: 'Conteneurs totalement isolés',
          benefit2: 'Zéro risque pour votre machine',
          benefit3: 'Environnement frais à la demande'
        },
        realLinux: {
          title: 'Vrais Outils, Vraies Technologies',
          description: 'Apprenez Linux, Docker, Kubernetes, GitLab CI/CD et plus. Pas de simulateurs—de vrais outils de production qui tournent dans le cloud.',
          benefit1: 'Linux (Alpine, Debian, Ubuntu)',
          benefit2: 'Docker & Kubernetes',
          benefit3: 'GitLab, CI/CD & outils DevOps'
        },
        instant: {
          title: 'Zéro Configuration, Dans le Navigateur',
          description: 'Pas d\'installations, pas de machines virtuelles, pas de clés SSH. Lancez un terminal en secondes et commencez à apprendre immédiatement.',
          benefit1: 'Fonctionne dans tout navigateur moderne',
          benefit2: 'Aucun téléchargement ni installation',
          benefit3: 'Accès depuis n\'importe où, à tout moment'
        }
      },

      howItWorks: {
        title: 'Commencez à Apprendre en 3 Étapes',
        step1: {
          title: 'Créez Votre Compte Gratuit',
          description: 'Inscrivez-vous en quelques secondes—sans carte bancaire, sans engagement'
        },
        step2: {
          title: 'Créez Votre Terminal',
          description: 'Choisissez votre distribution Linux (Alpine, Debian, Ubuntu) et lancez un vrai terminal instantanément. Templates avec outils préinstallés bientôt disponibles !'
        },
        step3: {
          title: 'Apprenez & Expérimentez',
          description: 'Pratiquez dans de vrais terminaux, exécutez de vraies commandes, cassez en toute sécurité—réinitialisez et réessayez à tout moment'
        }
      },

      readyToStart: 'Commencez Votre Apprentissage',

      useCases: {
        title: 'Conçu Pour Apprenants et Formateurs',
        students: {
          title: 'Étudiants',
          description: 'Apprenez Linux, Docker et Kubernetes sans configuration complexe. Pratiquez les compétences DevOps en toute sécurité avant de les utiliser en production.'
        },
        educators: {
          title: 'Formateurs & Enseignants',
          description: 'Délivrez des cours pratiques sans infrastructure à gérer. Les étudiants obtiennent des environnements cohérents pour Linux, Docker, GitLab et plus.'
        },
        developers: {
          title: 'Développeurs',
          description: 'Testez rapidement des conteneurs Docker, des configs Kubernetes et des scripts dans des environnements propres qui se réinitialisent automatiquement.'
        },
        testers: {
          title: 'Ingénieurs DevOps',
          description: 'Expérimentez avec GitLab CI/CD, outils d\'infrastructure et scripts d\'automatisation dans des bacs à sable sûrs qui imitent la production.'
        }
      },

      footer: {
        description: 'Open Course Factory fournit des terminaux dans le navigateur pour l\'apprentissage pratique du DevOps. Pratiquez Linux, Docker, Kubernetes, GitLab et plus—en toute sécurité et instantanément.',
        platform: 'Plateforme',
        documentation: 'Documentation',
        gitlab: 'Dépôt GitLab',
        legal: 'Mentions légales',
        resources: 'Ressources d\'Apprentissage',
        gettingStarted: 'Guide de démarrage',
        troubleshooting: 'Dépannage',
        rights: 'Tous droits réservés'
      }
    }
  }
})

const { versions } = useVersionInfo()
</script>

<style scoped>
/* ============================================
   TERMINAL ACADEMY DESIGN SYSTEM
   Monospace brutalism meets educational polish
   ============================================ */

/* ============================================
   FLOATING NAVIGATION
   ============================================ */
.floating-nav {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity var(--transition-slow), transform var(--transition-slow);
  pointer-events: none;
}

.floating-nav.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.nav-container {
  background: var(--color-bg-primary);
  border: var(--border-width-thin) solid var(--color-border-medium);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-sm);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-text-primary);
  text-decoration: none;
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.nav-link:hover {
  background: var(--color-bg-secondary);
  color: var(--color-primary);
  transform: translateX(-2px);
}

.nav-link i {
  width: 18px;
  text-align: center;
  font-size: var(--font-size-sm);
}

/* Responsive - hide on mobile */
@media (max-width: 768px) {
  .floating-nav {
    top: 10px;
    right: 10px;
  }

  .nav-link span {
    display: none;
  }

  .nav-container {
    padding: var(--spacing-xs);
  }

  .nav-link {
    padding: var(--spacing-sm);
    justify-content: center;
  }
}

/* Base & Typography */
.landing-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color: var(--color-text-primary);
  line-height: 1.6;
  overflow-x: hidden;
  background: var(--color-bg-primary);
  scroll-behavior: smooth;
}

/* Scroll margin for anchor targets */
#hero,
#features,
#use-cases,
#contact {
  scroll-margin-top: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ============================================
   HERO SECTION - Terminal Theme
   ============================================ */
.hero-section {
  background: #0a0e1a;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 60px 24px;
}

/* Animated terminal grid background */
.terminal-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: gridPulse 4s ease-in-out infinite;
}

@keyframes gridPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

/* CRT scanline effect */
.scanline {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 50%,
    rgba(0, 255, 65, 0.02) 50%
  );
  background-size: 100% 4px;
  animation: scanlineMove 8s linear infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes scanlineMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(100%); }
}

.hero-content {
  max-width: 900px;
  text-align: center;
  z-index: 2;
  animation: fadeInUp 1s ease-out;
}

/* Terminal-style prompt */
.terminal-prompt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 255, 65, 0.08);
  border: 1px solid rgba(0, 255, 65, 0.3);
  padding: 8px 20px;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 13px;
  color: #00ff41;
  margin-bottom: 32px;
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.15);
}

.prompt-char {
  color: #00ff41;
  font-weight: bold;
  font-size: 16px;
}

.typing-text {
  color: #8ae68d;
}

.cursor {
  animation: blink 1s step-end infinite;
  color: #00ff41;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 24px;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 48px;
  margin-left: auto;
  margin-right: auto;
}

/* Terminal Demo */
.terminal-demo {
  background: #1a1f2e;
  border-radius: 12px;
  overflow: hidden;
  margin: 48px auto;
  max-width: 680px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: terminalGlow 3s ease-in-out infinite;
}

@keyframes terminalGlow {
  0%, 100% { box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 30px rgba(0, 255, 65, 0.1); }
  50% { box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 40px rgba(0, 255, 65, 0.2); }
}

.terminal-header {
  background: #151a26;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 14px;
}

.terminal-user {
  color: #00ff41;
  font-weight: 600;
}

.terminal-separator {
  color: rgba(255, 255, 255, 0.6);
}

.terminal-path {
  color: #5eb3f6;
  font-weight: 600;
}

.terminal-body {
  padding: 24px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.8;
}

.terminal-line {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.prompt {
  color: #00ff41;
}

.command {
  color: #8ae68d;
}

.cursor-static {
  color: #00ff41;
  margin-left: 2px;
  animation: blink 1.2s step-end infinite;
}

.output {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  padding-left: 20px;
  white-space: pre;
}

/* CTA Buttons */
.cta-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  margin: 40px;
}

.btn {
  padding: 16px 32px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
}

.btn-primary {
  background: #00ff41;
  color: #0a0e1a;
  border-color: #00ff41;
  box-shadow: 0 4px 20px rgba(0, 255, 65, 0.3);
}

.btn-primary:hover {
  background: #00d936;
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 255, 65, 0.4);
}

.btn-icon {
  font-size: 20px;
  font-weight: bold;
}

.btn-secondary {
  background: transparent;
  color: #00ff41;
  border-color: #00ff41;
}

.btn-secondary:hover {
  background: rgba(0, 255, 65, 0.1);
  transform: translateY(-2px);
}

.btn-ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-ghost:hover {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.btn-large {
  padding: 20px 48px;
  font-size: 18px;
}

/* Trust Badges */
.trust-badges {
  display: flex;
  gap: 48px;
  justify-content: center;
  flex-wrap: wrap;
}

.badge-item {
  text-align: center;
}

.badge-number {
  font-size: 32px;
  font-weight: 900;
  color: #00ff41;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  margin-bottom: 8px;
}

.badge-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ============================================
   LEARNING FEATURES SECTION
   ============================================ */
.learning-features {
  padding: 120px 0;
  background: var(--color-bg-primary);
}

.section-header {
  text-align: center;
  margin-bottom: 80px;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  margin-bottom: 16px;
  color: var(--color-text-primary);
}

.section-description {
  font-size: 1.2rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
}

.feature-card {
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border-light);
  border-radius: 16px;
  padding: 40px 32px;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out;
  animation-delay: var(--card-delay, 0s);
  animation-fill-mode: both;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), #00ff41);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-card:hover {
  transform: translateY(-8px);
  border-color: var(--color-primary);
  box-shadow: 0 20px 50px rgba(102, 126, 234, 0.15);
}

.feature-icon {
  font-size: 2.5rem;
  margin-right: 16px;
  display: inline-block;
  vertical-align: middle;
  filter: drop-shadow(0 4px 12px rgba(0, 255, 65, 0.2));
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
}

.feature-desc {
  color: var(--color-text-secondary);
  margin-bottom: 24px;
  line-height: 1.7;
}

.feature-benefits {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-benefits li {
  padding: 10px 0;
  padding-left: 28px;
  position: relative;
  color: var(--color-text-secondary);
  font-size: 15px;
}

.feature-benefits li::before {
  content: '›';
  position: absolute;
  left: 0;
  color: #00ff41;
  font-weight: bold;
  font-size: 20px;
}

/* ============================================
   HOW IT WORKS
   ============================================ */
.how-it-works {
  padding: 120px 0;
  background: var(--color-bg-secondary);
}

.workflow {
  max-width: 800px;
  margin: 0 auto 64px;
}

.workflow-step {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 32px;
  margin-bottom: 48px;
  position: relative;
}

.step-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.step-number {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #00ff41);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 900;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  position: relative;
  z-index: 2;
}

.step-connector {
  width: 3px;
  height: 80px;
  background: linear-gradient(180deg, var(--color-primary), var(--color-border-medium));
  margin-top: 8px;
}

.step-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--color-text-primary);
}

.step-content p {
  color: var(--color-text-secondary);
  line-height: 1.7;
  font-size: 1.05rem;
}

.cta-centered {
  text-align: center;
}

/* ============================================
   USE CASES
   ============================================ */
.use-cases {
  padding: 120px 0;
  background: var(--color-bg-primary);
}

.use-case-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
}

.use-case-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.use-case-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.1);
}

.use-case-icon {
  font-size: 56px;
  margin-bottom: 20px;
  display: block;
}

.use-case-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--color-text-primary);
}

.use-case-card p {
  color: var(--color-text-secondary);
  line-height: 1.6;
  font-size: 15px;
}

/* ============================================
   FOOTER
   ============================================ */
.footer-section {
  background: #0a0e1a;
  color: rgba(255, 255, 255, 0.8);
  padding: 80px 0 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 64px;
  margin-bottom: 48px;
}

.footer-brand h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #ffffff;
}

.footer-brand p {
  line-height: 1.7;
  margin-bottom: 16px;
}

.footer-contact {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-contact a {
  color: #00ff41;
  text-decoration: none;
  transition: opacity 0.3s ease;
}

.footer-contact a:hover {
  opacity: 0.8;
}

.footer-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.link-group h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #ffffff;
}

.link-group a {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  padding: 6px 0;
  transition: color 0.3s ease;
  font-size: 15px;
}

.link-group a:hover {
  color: #00ff41;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.version-item {
  opacity: 0.7;
}

.version-divider {
  opacity: 0.5;
}

/* ============================================
   ANIMATIONS
   ============================================ */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.2rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .terminal-demo {
    margin: 32px auto;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .trust-badges {
    gap: 32px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .workflow-step {
    grid-template-columns: 60px 1fr;
    gap: 20px;
  }

  .step-number {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }

  .use-case-grid {
    grid-template-columns: 1fr;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .footer-links {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
  }
}
</style>
