<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <header class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge">🚀 {{ t('landing.platformReady') }}</span>
        </div>
        <h1 class="hero-title">{{ t('landing.heroTitle') }}</h1>
        <p class="hero-subtitle">{{ t('landing.heroSubtitle') }}</p>
        <div class="cta-buttons">
          <router-link to="/login" class="btn btn-primary btn-lg">
            <i class="fas fa-sign-in-alt"></i>
            {{ t('landing.login') }}
          </router-link>
          <router-link to="/register" class="btn btn-outline-light btn-lg">
            <i class="fas fa-user-plus"></i>
            {{ t('landing.register') }}
          </router-link>
          <router-link to="/help-public" class="btn btn-help btn-lg">
            <i class="fas fa-question-circle"></i>
            {{ t('landing.help') }}
          </router-link>
        </div>
      </div>
      <div class="hero-animation">
        <div class="floating-cards">
          <div class="card card-1">🖥️ {{ t('landing.terminals') }}</div>
          <div class="card card-2">💳 {{ t('landing.subscriptions') }}</div>
          <div class="card card-3">🌍 {{ t('landing.multiLanguage') }}</div>
        </div>
      </div>

    </header>


    <!-- Main Features -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">{{ t('landing.features.title') }}</h2>
        <div class="features-grid">

          <!-- Terminal Management -->
          <div class="feature-card feature-terminal">
            <div class="feature-icon">🖥️</div>
            <h3>{{ t('landing.features.terminals.title') }}</h3>
            <p>{{ t('landing.features.terminals.description') }}</p>
            <ul class="feature-list">
              <li>{{ t('landing.features.terminals.interactive') }}</li>
              <li>{{ t('landing.features.terminals.sharing') }}</li>
              <li>{{ t('landing.features.terminals.ssh') }}</li>
              <li>{{ t('landing.features.terminals.realTime') }}</li>
            </ul>
          </div>

          <!-- Subscription System -->
          <div class="feature-card feature-billing">
            <div class="feature-icon">💳</div>
            <h3>{{ t('landing.features.billing.title') }}</h3>
            <p>{{ t('landing.features.billing.description') }}</p>
            <ul class="feature-list">
              <li>{{ t('landing.features.billing.flexible') }}</li>
              <li>{{ t('landing.features.billing.plans') }}</li>
              <li>{{ t('landing.features.billing.invoices') }}</li>
              <li>{{ t('landing.features.billing.portal') }}</li>
            </ul>
          </div>

          <!-- Multi-language -->
          <div class="feature-card feature-i18n">
            <div class="feature-icon">🌍</div>
            <h3>{{ t('landing.features.i18n.title') }}</h3>
            <p>{{ t('landing.features.i18n.description') }}</p>
            <ul class="feature-list">
              <li>{{ t('landing.features.i18n.french') }}</li>
              <li>{{ t('landing.features.i18n.english') }}</li>
              <li>{{ t('landing.features.i18n.embedded') }}</li>
              <li>{{ t('landing.features.i18n.dynamic') }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Technology Stack -->
    <section class="tech-section">
      <div class="container">
        <h2 class="section-title">{{ t('landing.tech.title') }}</h2>
        <p class="section-subtitle">{{ t('landing.tech.subtitle') }}</p>
        <div class="tech-grid">
          <div class="tech-card">
            <div class="tech-logo">⚡</div>
            <h4>Vue 3</h4>
            <p>{{ t('landing.tech.vue') }}</p>
          </div>
          <div class="tech-card">
            <div class="tech-logo">🏪</div>
            <h4>Pinia</h4>
            <p>{{ t('landing.tech.pinia') }}</p>
          </div>
          <div class="tech-card">
            <div class="tech-logo">🛣️</div>
            <h4>Vue Router</h4>
            <p>{{ t('landing.tech.router') }}</p>
          </div>
          <div class="tech-card">
            <div class="tech-logo">🔧</div>
            <h4>Vite</h4>
            <p>{{ t('landing.tech.vite') }}</p>
          </div>
          <div class="tech-card">
            <div class="tech-logo">💎</div>
            <h4>TypeScript</h4>
            <p>{{ t('landing.tech.typescript') }}</p>
          </div>
          <div class="tech-card">
            <div class="tech-logo">🎨</div>
            <h4>Element Plus</h4>
            <p>{{ t('landing.tech.ui') }}</p>
          </div>
        </div>
      </div>
    </section>


    <!-- Getting Started -->
    <section class="getting-started-section">
      <div class="container">
        <h2 class="section-title">{{ t('landing.gettingStarted.title') }}</h2>
        <div class="steps-grid">
          <div class="step">
            <div class="step-number">1</div>
            <h3>{{ t('landing.gettingStarted.step1.title') }}</h3>
            <p>{{ t('landing.gettingStarted.step1.description') }}</p>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <h3>{{ t('landing.gettingStarted.step2.title') }}</h3>
            <p>{{ t('landing.gettingStarted.step2.description') }}</p>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <h3>{{ t('landing.gettingStarted.step3.title') }}</h3>
            <p>{{ t('landing.gettingStarted.step3.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer-section">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>Open Course Factory</h3>
            <p>{{ t('landing.footer.description') }}</p>
          </div>
          <div class="footer-links">
            <div class="link-group">
              <h4>{{ t('landing.footer.product') }}</h4>
              <a href="#features">{{ t('landing.footer.features') }}</a>
              <a href="#tech">{{ t('landing.footer.technology') }}</a>
              <a href="#demo">{{ t('landing.footer.demo') }}</a>
            </div>
            <div class="link-group">
              <h4>{{ t('landing.footer.resources') }}</h4>
              <a href="/help" target="_blank">{{ t('landing.footer.documentation') }}</a>
              <a href="https://github.com" target="_blank">{{ t('landing.footer.github') }}</a>
              <a href="/help" target="_blank">{{ t('landing.footer.support') }}</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-left">
            <p>&copy; 2023-2025 Solution Libre. {{ t('landing.footer.rights') }} - <span class="version">v{{ packageJson.version }}</span></p>
          </div>
          <div class="footer-language">
            <button @click="toggleLanguage" class="language-toggle">
              🌍 {{ currentLocale.toUpperCase() }}
            </button>
          </div>
        </div>
      </div>
    </footer>

    <!-- Floating scroll indicator -->
    <div class="floating-scroll-indicator"
         @click="scrollToNextSection"
         :class="{ 'at-bottom': isAtBottom }">
      <div class="floating-scroll-arrow">
        <div class="css-triangle" :class="{ 'up': isAtBottom, 'down': !isAtBottom }"></div>
      </div>
      <p class="floating-scroll-text">{{ isAtBottom ? t('landing.backToTop') : t('landing.scrollDown') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from '../../composables/useLocale'
import packageJson from '../../../package.json'

const { t } = useI18n()
const { currentLocale, setLocale } = useLocale()
const showScrollIndicator = ref(true)
const isAtBottom = ref(false)

const toggleLanguage = () => {
  const newLocale = currentLocale.value === 'en' ? 'fr' : 'en'
  setLocale(newLocale)
}


const scrollToNextSection = () => {
  // Always check current position when clicked
  const currentScrollY = Math.max(
    window.scrollY || 0,
    window.pageYOffset || 0,
    document.documentElement.scrollTop || 0,
    document.body.scrollTop || 0
  )

  // Check if footer is visible right now
  const footerSection = document.querySelector('.footer-section') as HTMLElement
  if (footerSection) {
    const footerRect = footerSection.getBoundingClientRect()
    const isCurrentlyAtBottom = footerRect.top < window.innerHeight * 0.8

    if (isCurrentlyAtBottom) {
      // Update the reactive state immediately
      isAtBottom.value = true

      // Try multiple scroll methods
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
        document.body.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (e) {
        // Fallback for older browsers
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }
      return
    } else {
      // Update the reactive state immediately
      isAtBottom.value = false
    }
  }

  // Get all sections
  const sections = [
    document.querySelector('.features-section') as HTMLElement,
    document.querySelector('.tech-section') as HTMLElement,
    document.querySelector('.getting-started-section') as HTMLElement,
    document.querySelector('.footer-section') as HTMLElement
  ]

  // Check which section is currently visible in viewport
  let targetSection = null

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    if (section) {
      const sectionTop = section.getBoundingClientRect().top + currentScrollY

      // If this section is below current scroll position, it's our target
      if (sectionTop > currentScrollY + 200) {
        targetSection = section
        break
      }
    }
  }

  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    // If no section found below, scroll back to top
    console.log('No target section, scrolling to top')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const handleScrollNew = () => {
  const scrollY = Math.max(
    window.scrollY || 0,
    window.pageYOffset || 0,
    document.documentElement.scrollTop || 0,
    document.body.scrollTop || 0
  )
  const documentHeight = document.documentElement.scrollHeight
  const windowHeight = window.innerHeight

  // Show indicator always except when very close to bottom
  showScrollIndicator.value = scrollY < documentHeight - windowHeight - 50

  // Update bottom state
  const footerSection = document.querySelector('.footer-section') as HTMLElement
  if (footerSection) {
    const footerRect = footerSection.getBoundingClientRect()
    const threshold = windowHeight * 0.8
    isAtBottom.value = footerRect.top < threshold
  } else {
    // If no footer section, definitely not at bottom
    isAtBottom.value = false
  }

  // Keep the button always readable - no complex color detection needed
}

// Add translations
onMounted(() => {
  const { mergeLocaleMessage } = useI18n()

  // Simple scroll listener
  const onScroll = () => {
    handleScrollNew()
  }

  // Add scroll listeners
  window.addEventListener('scroll', onScroll, { passive: true })

  // Fallback: Use intersection observer to detect when sections come into view
  const observer = new IntersectionObserver(() => {
    handleScrollNew()
  }, {
    threshold: [0, 0.5, 1],
    rootMargin: '-10% 0px -10% 0px'
  })

  // Observe key sections
  const sectionsToObserve = [
    '.hero-section',
    '.features-section',
    '.tech-section',
    '.getting-started-section',
    '.footer-section'
  ]

  sectionsToObserve.forEach(selector => {
    const element = document.querySelector(selector)
    if (element) {
      observer.observe(element)
    }
  })

  // Initial call
  setTimeout(() => {
    handleScrollNew()
  }, 100)

  mergeLocaleMessage('fr', {
    landing: {
      platformReady: 'Essai gratuit disponible',
      heroTitle: 'Open Course Factory',
      heroSubtitle: 'Testez gratuitement sans carte bancaire ! Terminaux SSH, système d\'abonnement flexible et interface multilingue',
      login: 'Se connecter',
      register: "S'inscrire gratuitement",
      help: 'Aide',
      terminals: 'Terminaux',
      subscriptions: 'Abonnements',
      multiLanguage: 'Multilingue',
      scrollDown: 'Découvrir plus',
      backToTop: 'Retour en haut',

      features: {
        title: 'Fonctionnalités Principales',
        terminals: {
          title: 'Terminaux Interactifs',
          description: 'Accédez à des terminaux SSH sécurisés avec XTerm.js et partage en temps réel',
          interactive: 'Sessions terminaux interactives',
          sharing: 'Partage de sessions en temps réel',
          ssh: 'Gestion des clés SSH',
          realTime: 'Collaboration instantanée'
        },
        billing: {
          title: 'Plan Gratuit & Abonnements',
          description: 'Commencez gratuitement sans carte bancaire, puis choisissez un plan pour plus de fonctionnalités',
          flexible: 'Plan gratuit pour tester la plateforme',
          plans: 'Plans payants pour fonctionnalités avancées',
          invoices: 'Facturation sécurisée avec Stripe',
          portal: 'Aucune carte requise pour débuter'
        },
        i18n: {
          title: 'Support Multi-langues',
          description: 'Interface entièrement traduite en français et anglais',
          french: 'Français (langue par défaut)',
          english: 'Anglais (langue alternative)',
          embedded: 'Traductions intégrées aux composants',
          dynamic: 'Changement de langue instantané'
        }
      },

      tech: {
        title: 'Technologies Modernes',
        subtitle: 'Stack technique de pointe pour une expérience optimale',
        vue: 'Vue 3 Composition API avec TypeScript',
        pinia: 'Pinia pour la gestion d\'état',
        router: 'Vue Router avec guards d\'authentification',
        vite: 'Vite pour un build ultra-rapide',
        typescript: 'TypeScript pour la sûreté du code',
        ui: 'Element Plus et Vuetify pour l\'interface'
      },

      gettingStarted: {
        title: 'Commencer',
        step1: {
          title: 'Créer un compte gratuit',
          description: 'Inscription en 2 minutes, sans carte bancaire'
        },
        step2: {
          title: 'Tester gratuitement',
          description: 'Explorez toutes les fonctionnalités du plan gratuit'
        },
        step3: {
          title: 'Passer à un plan payant (optionnel)',
          description: 'Débloquez plus de fonctionnalités quand vous êtes prêt'
        }
      },

      footer: {
        description: 'Plateforme de gestion avec terminaux et abonnements intégrés',
        product: 'Produit',
        features: 'Fonctionnalités',
        technology: 'Technologies',
        demo: 'Démo',
        resources: 'Ressources',
        documentation: 'Documentation',
        github: 'GitHub',
        support: 'Support',
        rights: 'Tous droits réservés'
      }
    }
  })

  mergeLocaleMessage('en', {
    landing: {
      platformReady: 'Free Trial Available',
      heroTitle: 'Open Course Factory',
      heroSubtitle: 'Test for free without credit card! SSH terminals, flexible subscription system, and multilingual interface',
      login: 'Login',
      register: 'Sign Up Free',
      help: 'Help',
      terminals: 'Terminals',
      subscriptions: 'Subscriptions',
      multiLanguage: 'Multi-language',
      scrollDown: 'Discover more',
      backToTop: 'Back to top',

      features: {
        title: 'Core Features',
        terminals: {
          title: 'Interactive Terminals',
          description: 'Access secure SSH terminals with XTerm.js and real-time sharing',
          interactive: 'Interactive terminal sessions',
          sharing: 'Real-time session sharing',
          ssh: 'SSH key management',
          realTime: 'Instant collaboration'
        },
        billing: {
          title: 'Free Plan & Subscriptions',
          description: 'Start free without credit card, then choose a plan for more features',
          flexible: 'Free plan to test the platform',
          plans: 'Paid plans for advanced features',
          invoices: 'Secure billing with Stripe',
          portal: 'No card required to start'
        },
        i18n: {
          title: 'Multi-language Support',
          description: 'Fully translated interface in French and English',
          french: 'French (default language)',
          english: 'English (alternative language)',
          embedded: 'Component-embedded translations',
          dynamic: 'Instant language switching'
        }
      },

      tech: {
        title: 'Modern Technologies',
        subtitle: 'Cutting-edge tech stack for optimal experience',
        vue: 'Vue 3 Composition API with TypeScript',
        pinia: 'Pinia for state management',
        router: 'Vue Router with authentication guards',
        vite: 'Vite for ultra-fast build',
        typescript: 'TypeScript for code safety',
        ui: 'Element Plus and Vuetify for UI'
      },

      gettingStarted: {
        title: 'Getting Started',
        step1: {
          title: 'Create Free Account',
          description: '2-minute signup, no credit card required'
        },
        step2: {
          title: 'Test for Free',
          description: 'Explore all features of the free plan'
        },
        step3: {
          title: 'Upgrade to Paid Plan (Optional)',
          description: 'Unlock more features when you\'re ready'
        }
      },

      footer: {
        description: 'Management platform with integrated terminals and subscriptions',
        product: 'Product',
        features: 'Features',
        technology: 'Technology',
        demo: 'Demo',
        resources: 'Resources',
        documentation: 'Documentation',
        github: 'GitHub',
        support: 'Support',
        rights: 'All rights reserved'
      }
    }
  })
})

onUnmounted(() => {
  // Cleanup will be handled automatically by Vue
})
</script>

<style scoped>
/* Reset and base styles */
.landing-page {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
  overflow-x: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 0 20px;
}

.hero-content {
  max-width: 700px;
  text-align: center;
  z-index: 2;
  animation: fadeInUp 0.8s ease-out;
}

.hero-badge {
  margin-bottom: 20px;
}

.badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.3rem;
  margin-bottom: 40px;
  opacity: 0.9;
  font-weight: 300;
}

.cta-buttons {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 15px 30px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 2px solid transparent;
}

.btn-primary {
  background: #fff;
  color: #667eea;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(255, 255, 255, 0.3);
}

.btn-outline-light {
  border: 2px solid #fff;
  color: #fff;
  background: transparent;
}

.btn-outline-light:hover {
  background: #fff;
  color: #667eea;
  transform: translateY(-2px);
}

.btn-help {
  border: 2px solid rgba(255, 255, 255, 0.8);
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.btn-help:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-color: #fff;
  transform: translateY(-2px);
}


.hero-animation {
  position: absolute;
  right: 5%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  opacity: 0.7;
}

.floating-cards {
  position: relative;
}

.card {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin: 20px 0;
  animation: float 3s ease-in-out infinite;
}

.card-1 { animation-delay: 0s; }
.card-2 { animation-delay: 1s; }
.card-3 { animation-delay: 2s; }

/* Floating Scroll Indicator */
.floating-scroll-indicator {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  cursor: pointer;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  filter: drop-shadow(0 8px 25px rgba(102, 126, 234, 0.15));
}

.floating-scroll-arrow {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
  animation: bounce 2s infinite;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.floating-scroll-arrow::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(145deg, #667eea 0%, #764ba2 50%, #667eea 100%);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.4s ease;
}

.floating-scroll-arrow::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 50%;
  background: linear-gradient(145deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05));
  transition: all 0.4s ease;
}

.floating-scroll-indicator:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 12px 35px rgba(102, 126, 234, 0.25));
}

.floating-scroll-indicator:hover .floating-scroll-arrow {
  transform: scale(1.1);
  animation-play-state: paused;
}

.floating-scroll-indicator:hover .floating-scroll-arrow::before {
  background: linear-gradient(145deg, #5a6fd8 0%, #6b5ca6 50%, #5a6fd8 100%);
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
}

.css-triangle {
  width: 0;
  height: 0;
  position: relative;
  z-index: 3;
  transition: all 0.4s ease;
  margin: auto;
}

.css-triangle.down {
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid #ffffff;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
  transform: translateY(1px);
}

.css-triangle.up {
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 8px solid #ffffff;
  filter: drop-shadow(0 -1px 3px rgba(0, 0, 0, 0.2));
  transform: translateY(-1px);
}

.floating-scroll-text {
  font-size: 11px;
  margin: 0;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.8));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
  transition: all 0.4s ease;
}

.floating-scroll-indicator:hover .floating-scroll-text {
  background: linear-gradient(145deg, rgba(90, 111, 216, 0.95), rgba(107, 92, 166, 0.85));
  border-color: rgba(255,255,255,0.3);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

/* Special styling when at bottom */
.floating-scroll-indicator.at-bottom {
  filter: drop-shadow(0 8px 25px rgba(245, 158, 11, 0.15));
}

.floating-scroll-indicator.at-bottom:hover {
  filter: drop-shadow(0 12px 35px rgba(245, 158, 11, 0.25));
}

.floating-scroll-indicator.at-bottom .floating-scroll-arrow {
  animation: bounceUp 2s infinite;
}

.floating-scroll-indicator.at-bottom .floating-scroll-arrow::before {
  background: linear-gradient(145deg, #f59e0b 0%, #f97316 50%, #f59e0b 100%);
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
}

.floating-scroll-indicator.at-bottom:hover .floating-scroll-arrow::before {
  background: linear-gradient(145deg, #e18a07 0%, #ea6013 50%, #e18a07 100%);
  box-shadow: 0 6px 25px rgba(245, 158, 11, 0.5);
}

.floating-scroll-indicator.at-bottom .floating-scroll-text {
  background: linear-gradient(145deg, rgba(245, 158, 11, 0.9), rgba(249, 115, 22, 0.8));
  border-color: rgba(255,255,255,0.3);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);
}

.floating-scroll-indicator.at-bottom:hover .floating-scroll-text {
  background: linear-gradient(145deg, rgba(225, 138, 7, 0.95), rgba(234, 96, 19, 0.85));
  border-color: rgba(255,255,255,0.4);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
}


.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 20px;
  color: #1a1a1a;
}

.section-subtitle {
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 60px;
  color: #6b7280;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}


/* Features Section */
.features-section {
  padding: 60px 0;
  background: #fff;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.feature-card {
  padding: 30px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  display: block;
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: #1a1a1a;
}

.feature-card p {
  color: #6b7280;
  margin-bottom: 20px;
}

.feature-list {
  list-style: none;
  padding: 0;
}

.feature-list li {
  padding: 8px 0;
  color: #4b5563;
  position: relative;
  padding-left: 20px;
}

.feature-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: bold;
}

/* Technology Section */
.tech-section {
  padding: 80px 0;
  background: #1f2937;
  color: #fff;
}

.tech-section .section-title,
.tech-section .section-subtitle {
  color: #fff;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.tech-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.tech-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
}

.tech-logo {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.tech-card h4 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: #fff;
}

.tech-card p {
  color: #d1d5db;
  font-size: 0.9rem;
}


/* Getting Started Section */
.getting-started-section {
  padding: 80px 0;
  background: #f8fafc;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
}

.step {
  text-align: center;
  padding: 40px 20px;
}

.step-number {
  width: 60px;
  height: 60px;
  background: #667eea;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 auto 20px;
}

.step h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: #1a1a1a;
}

.step p {
  color: #6b7280;
  line-height: 1.6;
}

/* Footer */
.footer-section {
  background: #1f2937;
  color: #fff;
  padding: 60px 0 20px;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 60px;
  margin-bottom: 40px;
}

.footer-brand h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 15px;
  color: #fff;
}

.footer-brand p {
  color: #d1d5db;
  line-height: 1.6;
}

.footer-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.link-group h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: #fff;
}

.link-group a {
  display: block;
  color: #d1d5db;
  text-decoration: none;
  padding: 5px 0;
  transition: color 0.3s ease;
}

.link-group a:hover {
  color: #667eea;
}

.footer-bottom {
  border-top: 1px solid #374151;
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  color: #d1d5db;
}

.version {
  color: #9ca3af;
  font-weight: normal;
}

.language-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.language-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Animations */
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

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
  60% {
    transform: translateY(-4px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes bounceUp {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(8px);
  }
  60% {
    transform: translateY(4px);
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .tech-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 25px;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .hero-animation {
    display: none;
  }

  .floating-scroll-indicator {
    bottom: 20px;
    right: 20px;
  }

  .floating-scroll-arrow {
    width: 40px;
    height: 40px;
  }

  .floating-scroll-arrow span {
    font-size: 16px;
  }

  .floating-scroll-text {
    font-size: 11px;
  }


  .footer-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .footer-links {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }


  .section-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .container {
    padding: 0 15px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .tech-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .steps-grid {
    grid-template-columns: 1fr;
  }
}
</style>
