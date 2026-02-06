<template>
  <div class="landing-page">
    <!-- Floating Navigation -->
    <nav class="floating-nav" :class="{ 'visible': showNav }" aria-label="Page navigation">
      <div class="nav-container">
        <a href="#hero" class="nav-link" @click.prevent="scrollToSection('hero')">
          <i class="fas fa-home" aria-hidden="true"></i>
          <span>{{ t('landing.nav.home') }}</span>
        </a>
        <a href="#features" class="nav-link" @click.prevent="scrollToSection('features')">
          <i class="fas fa-star" aria-hidden="true"></i>
          <span>{{ t('landing.nav.features') }}</span>
        </a>
        <a href="#use-cases" class="nav-link" @click.prevent="scrollToSection('use-cases')">
          <i class="fas fa-users" aria-hidden="true"></i>
          <span>{{ t('landing.nav.useCases') }}</span>
        </a>
        <a href="#contact" class="nav-link" @click.prevent="scrollToSection('contact')">
          <i class="fas fa-envelope" aria-hidden="true"></i>
          <span>{{ t('landing.nav.contact') }}</span>
        </a>
      </div>
    </nav>

    <!-- Hero Section with Terminal Theme -->
    <header id="hero" class="hero-section">
      <!-- Animated terminal grid background -->
      <div class="terminal-grid" aria-hidden="true"></div>
      <div class="scanline" aria-hidden="true"></div>

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

        <p class="hero-subtitle">{{ t('landing.heroSubtitle') }}</p>

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

        <!-- Simulated terminal snippet with typing animation -->
        <div class="terminal-demo">
          <div class="terminal-header">
            <span class="terminal-user">user@opencourse-factory</span>
          </div>
          <div class="terminal-body">
            <div class="terminal-line" v-if="terminalStep >= 1">
              <span class="prompt">$</span>
              <span class="command typing-anim">{{ typedCommand1 }}</span>
              <span class="cursor-static" v-if="terminalStep === 1">_</span>
            </div>
            <div class="terminal-line output" v-if="terminalStep >= 2">{{ t('landing.demo.output1') }}</div>
            <div class="terminal-line" v-if="terminalStep >= 3">
              <span class="prompt">$</span>
              <span class="command typing-anim">{{ typedCommand2 }}</span>
              <span class="cursor-static" v-if="terminalStep >= 3">_</span>
            </div>
          </div>
        </div>

        <!-- Trust indicators -->
        <div class="trust-badges">
          <div class="badge-item">
            <div class="badge-number">1-8h</div>
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
          <div class="feature-card scroll-reveal" style="--card-delay: 0s">
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
          <div class="feature-card scroll-reveal" style="--card-delay: 0.15s">
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
          <div class="feature-card scroll-reveal" style="--card-delay: 0.3s">
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
          <div class="workflow-step scroll-reveal" v-for="index in 3" :key="index" :style="{ '--card-delay': `${(index - 1) * 0.15}s` }">
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
          <div class="use-case-card scroll-reveal" style="--card-delay: 0s">
            <div class="use-case-icon">🎓</div>
            <h3>{{ t('landing.useCases.students.title') }}</h3>
            <p>{{ t('landing.useCases.students.description') }}</p>
          </div>

          <div class="use-case-card scroll-reveal" style="--card-delay: 0.1s">
            <div class="use-case-icon">👨‍🏫</div>
            <h3>{{ t('landing.useCases.educators.title') }}</h3>
            <p>{{ t('landing.useCases.educators.description') }}</p>
          </div>

          <div class="use-case-card scroll-reveal" style="--card-delay: 0.2s">
            <div class="use-case-icon">👨‍💻</div>
            <h3>{{ t('landing.useCases.developers.title') }}</h3>
            <p>{{ t('landing.useCases.developers.description') }}</p>
          </div>

          <div class="use-case-card scroll-reveal" style="--card-delay: 0.3s">
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
              <i class="fas fa-envelope" aria-hidden="true"></i>
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
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useVersionInfo } from '../../composables/useVersionInfo'
import AlphaBadge from '../Common/AlphaBadge.vue'
import LanguageSelector from '../UI/LanguageSelector.vue'

// State for floating nav visibility
const showNav = ref(false)
let navObserver: IntersectionObserver | null = null
let scrollRevealObserver: IntersectionObserver | null = null

// Terminal typing animation state
const terminalStep = ref(0)
const typedCommand1 = ref('')
const typedCommand2 = ref('')
let typingTimeouts: number[] = []

function typeText(text: string, target: typeof typedCommand1, speed: number = 50): Promise<void> {
  return new Promise((resolve) => {
    let i = 0
    function typeChar() {
      if (i < text.length) {
        target.value = text.substring(0, i + 1)
        i++
        const timeout = window.setTimeout(typeChar, speed + Math.random() * 30)
        typingTimeouts.push(timeout)
      } else {
        resolve()
      }
    }
    typeChar()
  })
}

async function startTerminalAnimation() {
  // Step 1: type first command
  terminalStep.value = 1
  await typeText('docker ps -a', typedCommand1, 60)

  // Pause before showing output
  await new Promise(r => {
    const t = window.setTimeout(r, 400)
    typingTimeouts.push(t)
  })

  // Step 2: show output
  terminalStep.value = 2

  // Pause before second command
  await new Promise(r => {
    const t = window.setTimeout(r, 600)
    typingTimeouts.push(t)
  })

  // Step 3: type second command
  terminalStep.value = 3
  await typeText('kubectl get pods', typedCommand2, 60)
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

// Use IntersectionObserver to show/hide floating nav
// When hero is visible => hide nav, when hero leaves => show nav
onMounted(async () => {
  const heroEl = document.getElementById('hero')
  if (heroEl) {
    navObserver = new IntersectionObserver(
      ([entry]) => {
        showNav.value = !entry.isIntersecting
      },
      { threshold: 0.1 }
    )
    navObserver.observe(heroEl)
  }

  // Setup scroll-reveal observer for cards and sections
  await nextTick()
  scrollRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          scrollRevealObserver?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  )

  document.querySelectorAll('.scroll-reveal').forEach((el) => {
    scrollRevealObserver?.observe(el)
  })

  // Start terminal typing animation after a short delay
  setTimeout(() => {
    startTerminalAnimation()
  }, 800)

  // Check if there's a hash in URL on mount
  if (window.location.hash) {
    const sectionId = window.location.hash.substring(1)
    setTimeout(() => {
      scrollToSection(sectionId)
    }, 100)
  }
})

onBeforeUnmount(() => {
  if (navObserver) {
    navObserver.disconnect()
  }
  if (scrollRevealObserver) {
    scrollRevealObserver.disconnect()
  }
  typingTimeouts.forEach(t => clearTimeout(t))
})

const { t } = useTranslations({
  en: {
    landing: {
      promptText: 'initializing learning environment...',
      nav: {
        home: 'Home',
        features: 'Features',
        useCases: 'Use cases',
        contact: 'Contact'
      },
      heroTitle: 'Learn Linux, Docker, Kubernetes & more, right in your browser',
      heroSubtitle: 'Hands-on training for DevOps technologies without breaking anything. Practice Linux, Docker, GitLab, Kubernetes, and other essential tools in safe, isolated environments that reset automatically.',
      terminalTitle: 'terminal — bash',
      demo: {
        command1: 'docker ps -a',
        output1: 'CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS\nabc123def456   nginx     "nginx"   2m ago    Up 2m',
        command2: 'kubectl get pods'
      },
      startLearning: 'Start learning free',
      login: 'Sign in',
      learnMore: 'View documentation',
      badges: {
        sessionReset: 'Session duration',
        isolated: 'Isolated & safe',
        installation: 'Setup required'
      },

      learning: {
        title: 'Master DevOps technologies through practice',
        subtitle: 'Everything runs in your browser. Experiment freely with real tools in safe, ephemeral environments.',
        safe: {
          title: 'Experiment without breaking anything',
          description: 'Isolated environments with sessions from 1 to 8 hours depending on your plan. Try risky commands, test configurations, make mistakes: your system stays perfectly safe.',
          benefit1: 'Fully isolated containers',
          benefit2: 'Zero risk to your machine',
          benefit3: 'Fresh environment on demand'
        },
        realLinux: {
          title: 'Real tools, real technologies',
          description: 'Learn Linux, Docker, Kubernetes, GitLab CI/CD, and more. Not simulators, actual production tools running in the cloud.',
          benefit1: 'Linux (Alpine, Debian, Ubuntu)',
          benefit2: 'Docker & Kubernetes',
          benefit3: 'GitLab, CI/CD & DevOps tools'
        },
        instant: {
          title: 'Zero setup, browser-based',
          description: 'No installations, no virtual machines, no SSH keys. Launch a terminal in seconds and start learning immediately.',
          benefit1: 'Works in any modern browser',
          benefit2: 'No downloads or installations',
          benefit3: 'Access from anywhere, anytime'
        }
      },

      howItWorks: {
        title: 'Start learning in 3 simple steps',
        step1: {
          title: 'Create your free account',
          description: 'Sign up in seconds, no credit card required, no commitments'
        },
        step2: {
          title: 'Create your terminal',
          description: 'Choose your Linux distribution (Alpine, Debian, Ubuntu) and launch a real terminal instantly. Templates with pre-installed tools coming soon!'
        },
        step3: {
          title: 'Learn & experiment',
          description: 'Practice in real terminals, run actual commands, break things safely. Reset and try again anytime'
        }
      },

      readyToStart: 'Start your learning journey',

      useCases: {
        title: 'Built for learners and educators',
        students: {
          title: 'Students',
          description: 'Learn Linux, Docker, and Kubernetes without complex setup. Practice DevOps skills safely before using them in production.'
        },
        educators: {
          title: 'Educators & trainers',
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
        description: 'Open Course Factory provides browser-based terminals for hands-on DevOps learning. Practice Linux, Docker, Kubernetes, GitLab, and more, safely and instantly.',
        platform: 'Platform',
        documentation: 'Documentation',
        gitlab: 'GitLab repository',
        legal: 'Legal notices',
        resources: 'Learning resources',
        gettingStarted: 'Getting started guide',
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
      heroTitle: 'Apprenez Linux, Docker, Kubernetes & plus, dans votre navigateur',
      heroSubtitle: 'Formation pratique aux technologies DevOps sans rien casser. Pratiquez Linux, Docker, GitLab, Kubernetes et d\'autres outils essentiels dans des environnements sûrs et isolés qui se réinitialisent automatiquement.',
      terminalTitle: 'terminal — bash',
      demo: {
        command1: 'docker ps -a',
        output1: 'CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS\nabc123def456   nginx     "nginx"   2m ago    Up 2m',
        command2: 'kubectl get pods'
      },
      startLearning: 'Commencer gratuitement',
      login: 'Se connecter',
      learnMore: 'Voir la documentation',
      badges: {
        sessionReset: 'Durée de session',
        isolated: 'Isolé & sûr',
        installation: 'Installation requise'
      },

      learning: {
        title: 'Maîtrisez les technologies DevOps par la pratique',
        subtitle: 'Tout fonctionne dans votre navigateur. Expérimentez librement avec de vrais outils dans des environnements sûrs et éphémères.',
        safe: {
          title: 'Expérimentez sans rien casser',
          description: 'Environnements isolés avec des sessions de 1 à 8 heures selon votre plan. Essayez des commandes risquées, testez des configurations, faites des erreurs : votre système reste parfaitement sûr.',
          benefit1: 'Conteneurs totalement isolés',
          benefit2: 'Zéro risque pour votre machine',
          benefit3: 'Environnement frais à la demande'
        },
        realLinux: {
          title: 'Vrais outils, vraies technologies',
          description: 'Apprenez Linux, Docker, Kubernetes, GitLab CI/CD et plus. Pas de simulateurs, de vrais outils de production qui tournent dans le cloud.',
          benefit1: 'Linux (Alpine, Debian, Ubuntu)',
          benefit2: 'Docker & Kubernetes',
          benefit3: 'GitLab, CI/CD & outils DevOps'
        },
        instant: {
          title: 'Zéro configuration, dans le navigateur',
          description: 'Pas d\'installations, pas de machines virtuelles, pas de clés SSH. Lancez un terminal en secondes et commencez à apprendre immédiatement.',
          benefit1: 'Fonctionne dans tout navigateur moderne',
          benefit2: 'Aucun téléchargement ni installation',
          benefit3: 'Accès depuis n\'importe où, à tout moment'
        }
      },

      howItWorks: {
        title: 'Commencez à apprendre en 3 étapes',
        step1: {
          title: 'Créez votre compte gratuit',
          description: 'Inscrivez-vous en quelques secondes, sans carte bancaire ni engagement'
        },
        step2: {
          title: 'Créez votre terminal',
          description: 'Choisissez votre distribution Linux (Alpine, Debian, Ubuntu) et lancez un vrai terminal instantanément. Templates avec outils préinstallés bientôt disponibles !'
        },
        step3: {
          title: 'Apprenez & expérimentez',
          description: 'Pratiquez dans de vrais terminaux, exécutez de vraies commandes, cassez en toute sécurité. Réinitialisez et réessayez à tout moment'
        }
      },

      readyToStart: 'Commencez votre apprentissage',

      useCases: {
        title: 'Conçu pour apprenants et formateurs',
        students: {
          title: 'Étudiants',
          description: 'Apprenez Linux, Docker et Kubernetes sans configuration complexe. Pratiquez les compétences DevOps en toute sécurité avant de les utiliser en production.'
        },
        educators: {
          title: 'Formateurs & enseignants',
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
        description: 'Open Course Factory fournit des terminaux dans le navigateur pour l\'apprentissage pratique du DevOps. Pratiquez Linux, Docker, Kubernetes, GitLab et plus, en toute sécurité et instantanément.',
        platform: 'Plateforme',
        documentation: 'Documentation',
        gitlab: 'Dépôt GitLab',
        legal: 'Mentions légales',
        resources: 'Ressources d\'apprentissage',
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

/* Landing page color tokens */
.landing-page {
  --terminal-green: #00ff41;
  --terminal-green-hover: #00d936;
  --terminal-green-muted: #8ae68d;
  --terminal-green-bg: rgba(0, 255, 65, 0.08);
  --terminal-green-border: rgba(0, 255, 65, 0.3);
  --terminal-green-glow: rgba(0, 255, 65, 0.15);
  --terminal-green-shadow: rgba(0, 255, 65, 0.3);
  --terminal-dark-bg: #0a0e1a;
  --terminal-dark-surface: #1a1f2e;
  --terminal-dark-surface-alt: #151a26;
  --terminal-text-white: #ffffff;
  --terminal-text-light: rgba(255, 255, 255, 0.8);
  --terminal-text-muted: rgba(255, 255, 255, 0.75);
  --terminal-text-faint: rgba(255, 255, 255, 0.5);
  --terminal-border-subtle: rgba(255, 255, 255, 0.1);
  --terminal-border-faint: rgba(255, 255, 255, 0.08);
}

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
  background: var(--terminal-dark-bg);
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
    linear-gradient(rgba(0, 255, 65, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 65, 0.04) 1px, transparent 1px);
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
  background: var(--terminal-green-bg);
  border: 1px solid var(--terminal-green-border);
  padding: 8px 20px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 13px;
  color: var(--terminal-green);
  margin-bottom: 32px;
  box-shadow: 0 0 20px var(--terminal-green-glow);
}

.prompt-char {
  color: var(--terminal-green);
  font-weight: bold;
  font-size: 16px;
}

.typing-text {
  color: var(--terminal-green-muted);
}

.cursor {
  animation: blink 1s step-end infinite;
  color: var(--terminal-green);
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.hero-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(2.2rem, 4.5vw, 3.5rem);
  font-weight: 800;
  line-height: 1.15;
  margin-bottom: 24px;
  color: var(--terminal-text-white);
  letter-spacing: -0.03em;
}

.hero-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  line-height: 1.6;
  color: var(--terminal-text-light);
  margin-bottom: 32px;
  max-width: 750px;
  margin-left: auto;
  margin-right: auto;
}

/* Terminal Demo */
.terminal-demo {
  background: var(--terminal-dark-surface);
  border-radius: 12px;
  overflow: hidden;
  margin: 48px auto;
  max-width: 680px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--terminal-border-subtle);
  animation: terminalGlow 3s ease-in-out infinite;
}

@keyframes terminalGlow {
  0%, 100% { box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--terminal-border-subtle), 0 0 30px rgba(0, 255, 65, 0.1); }
  50% { box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--terminal-border-subtle), 0 0 40px rgba(0, 255, 65, 0.2); }
}

.terminal-header {
  background: var(--terminal-dark-surface-alt);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid var(--terminal-border-faint);
  font-family: 'JetBrains Mono', 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 14px;
}

.terminal-user {
  color: var(--terminal-green);
  font-weight: 600;
}

.terminal-separator {
  color: var(--terminal-text-muted);
}

.terminal-path {
  color: #5eb3f6;
  font-weight: 600;
}

.terminal-body {
  padding: 24px;
  font-family: 'JetBrains Mono', 'Monaco', 'Menlo', 'Courier New', monospace;
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
  color: var(--terminal-green);
}

.command {
  color: var(--terminal-green-muted);
}

.cursor-static {
  color: var(--terminal-green);
  margin-left: 2px;
  animation: blink 1.2s step-end infinite;
}

.output {
  color: var(--terminal-text-light);
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
  background: var(--terminal-green);
  color: var(--terminal-dark-bg);
  border-color: var(--terminal-green);
  box-shadow: 0 4px 20px var(--terminal-green-shadow);
}

.btn-primary:hover {
  background: var(--terminal-green-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 255, 65, 0.4);
}

.btn-icon {
  font-size: 20px;
  font-weight: bold;
}

.btn-secondary {
  background: transparent;
  color: var(--terminal-green);
  border-color: var(--terminal-green);
}

.btn-secondary:hover {
  background: var(--terminal-green-bg);
  transform: translateY(-2px);
}

.btn-ghost {
  background: transparent;
  color: var(--terminal-text-light);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-ghost:hover {
  color: var(--terminal-text-white);
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
  font-weight: 800;
  color: var(--terminal-green);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 8px;
}

.badge-label {
  font-size: 14px;
  color: var(--terminal-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ============================================
   LEARNING FEATURES SECTION
   ============================================ */
.learning-features {
  padding: 120px 0 100px;
  background: var(--color-bg-primary);
}

.section-header {
  text-align: center;
  margin-bottom: 80px;
}

.section-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
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
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
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
  background: linear-gradient(90deg, var(--terminal-green-muted), var(--terminal-green));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-card:hover {
  transform: translateY(-8px);
  border-color: var(--terminal-green);
  box-shadow: 0 20px 50px var(--terminal-green-glow);
}

.feature-icon {
  font-size: 2.5rem;
  margin-right: 16px;
  display: inline-block;
  vertical-align: middle;
  filter: drop-shadow(0 4px 12px var(--terminal-green-glow));
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
  color: var(--terminal-green);
  font-weight: bold;
  font-size: 20px;
}

/* ============================================
   HOW IT WORKS
   ============================================ */
.how-it-works {
  padding: 100px 0;
  background: var(--terminal-dark-bg);
  position: relative;
  overflow: hidden;
}

/* Subtle grid background to echo the hero */
.how-it-works::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 255, 65, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 65, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.5;
  pointer-events: none;
}

.how-it-works .section-title {
  color: var(--terminal-text-white);
}

.how-it-works .step-content h3 {
  color: var(--terminal-text-white);
}

.how-it-works .step-content p {
  color: var(--terminal-text-light);
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
  background: linear-gradient(135deg, var(--terminal-green-muted), var(--terminal-green));
  color: var(--terminal-dark-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 32px;
  font-weight: 800;
  box-shadow: 0 8px 24px var(--terminal-green-shadow);
  position: relative;
  z-index: 2;
}

.step-connector {
  width: 3px;
  height: 80px;
  background: linear-gradient(180deg, var(--terminal-green), rgba(255, 255, 255, 0.1));
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
  padding: 100px 0 120px;
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
  border-color: var(--terminal-green);
  box-shadow: 0 12px 32px var(--terminal-green-glow);
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
  background: var(--terminal-dark-bg);
  color: var(--terminal-text-light);
  padding: 80px 0 24px;
  border-top: 1px solid var(--terminal-border-subtle);
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 64px;
  margin-bottom: 48px;
}

.footer-brand h3 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--terminal-text-white);
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
  color: var(--terminal-green);
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
  color: var(--terminal-text-white);
}

.link-group a {
  display: block;
  color: var(--terminal-text-light);
  text-decoration: none;
  padding: 6px 0;
  transition: color 0.3s ease;
  font-size: 15px;
}

.link-group a:hover {
  color: var(--terminal-green);
}

.footer-bottom {
  border-top: 1px solid var(--terminal-border-subtle);
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
  color: var(--terminal-text-faint);
}

.version-item {
  opacity: 0.7;
}

.version-divider {
  opacity: 0.5;
}

/* ============================================
   SCROLL-REVEAL ANIMATIONS
   ============================================ */
.scroll-reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  transition-delay: var(--card-delay, 0s);
}

.scroll-reveal.revealed {
  opacity: 1;
  transform: translateY(0);
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
   REDUCED MOTION
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  .terminal-grid,
  .scanline {
    animation: none;
  }

  .cursor,
  .cursor-static {
    animation: none;
    opacity: 1;
  }

  .terminal-demo {
    animation: none;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--terminal-border-subtle);
  }

  .hero-content {
    animation: none;
  }

  .feature-card {
    animation: none;
  }

  .feature-card::before {
    transition: none;
  }

  .btn,
  .nav-link,
  .use-case-card,
  .feature-card {
    transition: none;
  }

  .floating-nav {
    transition: none;
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
