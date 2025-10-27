<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <header class="hero-section">
      <!-- Animated background elements -->
      <div class="hero-bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
      </div>

      <div class="hero-content">
        <div class="hero-badge pulse-animation">
          <span class="badge">
            <span class="badge-icon">✨</span>
            {{ t('landing.platformReady') }}
          </span>
        </div>
        <h1 class="hero-title">
          <span class="title-gradient">{{ t('landing.heroTitle') }}</span>
        </h1>
        <p class="hero-subtitle">{{ t('landing.heroSubtitle') }}</p>
        <div class="cta-buttons">
          <router-link to="/login" class="btn btn-primary btn-lg glow-on-hover">
            <i class="fas fa-sign-in-alt"></i>
            <span>{{ t('landing.login') }}</span>
          </router-link>
          <router-link to="/register" class="btn btn-glass btn-lg">
            <i class="fas fa-user-plus"></i>
            <span>{{ t('landing.register') }}</span>
          </router-link>
          <router-link to="/help-public" class="btn btn-outline-glow btn-lg">
            <i class="fas fa-question-circle"></i>
            <span>{{ t('landing.help') }}</span>
          </router-link>
        </div>
      </div>

      <div class="hero-animation">
        <div class="floating-cards">
          <div class="card card-1 glass-card">
            <div class="card-icon">🌐</div>
            <div class="card-text">{{ t('landing.browserBased') }}</div>
          </div>
          <div class="card card-2 glass-card">
            <div class="card-icon">⚡</div>
            <div class="card-text">{{ t('landing.zeroSetup') }}</div>
          </div>
          <div class="card card-3 glass-card">
            <div class="card-icon">🛡️</div>
            <div class="card-text">{{ t('landing.safeExperiment') }}</div>
          </div>
        </div>
      </div>
    </header>


    <!-- Main Features -->
    <section class="features-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title animate-on-scroll">
            <span class="title-underline">{{ t('landing.features.title') }}</span>
          </h2>
        </div>
        <div class="features-grid">
          <!-- Terminal Management -->
          <div class="feature-card feature-terminal glass-effect animate-on-scroll" style="--delay: 0.1s">
            <div class="feature-card-bg"></div>
            <div class="feature-icon icon-float">
              <span class="icon-glow">🖥️</span>
            </div>
            <h3 class="feature-title">{{ t('landing.features.terminals.title') }}</h3>
            <p class="feature-desc">{{ t('landing.features.terminals.description') }}</p>
            <ul class="feature-list">
              <li><span class="check-icon">✨</span> {{ t('landing.features.terminals.interactive') }}</li>
              <li><span class="check-icon">✨</span> {{ t('landing.features.terminals.sharing') }}</li>
              <li><span class="check-icon">✨</span> {{ t('landing.features.terminals.ssh') }}</li>
              <li><span class="check-icon">✨</span> {{ t('landing.features.terminals.realTime') }}</li>
            </ul>
          </div>

          <!-- Subscription System -->
          <div class="feature-card feature-billing glass-effect animate-on-scroll" style="--delay: 0.2s">
            <div class="feature-card-bg"></div>
            <div class="feature-icon icon-float">
              <span class="icon-glow">💳</span>
            </div>
            <h3 class="feature-title">{{ t('landing.features.billing.title') }}</h3>
            <p class="feature-desc">{{ t('landing.features.billing.description') }}</p>
            <ul class="feature-list">
              <li><span class="check-icon">✨</span> {{ t('landing.features.billing.flexible') }}</li>
              <li><span class="check-icon">✨</span> {{ t('landing.features.billing.plans') }}</li>
              <li><span class="check-icon">✨</span> {{ t('landing.features.billing.invoices') }}</li>
              <li><span class="check-icon">✨</span> {{ t('landing.features.billing.portal') }}</li>
            </ul>
          </div>

          <!-- Multi-language -->
          <div class="feature-card feature-i18n glass-effect animate-on-scroll" style="--delay: 0.3s">
            <div class="feature-card-bg"></div>
            <div class="feature-icon icon-float">
              <span class="icon-glow">🌍</span>
            </div>
            <h3 class="feature-title">{{ t('landing.features.i18n.title') }}</h3>
            <p class="feature-desc">{{ t('landing.features.i18n.description') }}</p>
            <ul class="feature-list">
              <li><span class="check-icon">✨</span> {{ t('landing.features.i18n.french') }}</li>
              <li><span class="check-icon">✨</span> {{ t('landing.features.i18n.english') }}</li>
              <li><span class="check-icon">✨</span> {{ t('landing.features.i18n.embedded') }}</li>
              <li><span class="check-icon">✨</span> {{ t('landing.features.i18n.dynamic') }}</li>
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
    <footer class="footer-section" id="footer">
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
              <a href="#" @click.prevent="scrollToSection('.features-section')">{{ t('landing.footer.features') }}</a>
              <a href="#" @click.prevent="scrollToSection('.tech-section')">{{ t('landing.footer.technology') }}</a>
              <a href="#" @click.prevent="scrollToSection('.getting-started-section')">{{ t('landing.footer.getStarted') }}</a>
            </div>
            <div class="link-group">
              <h4>{{ t('landing.footer.resources') }}</h4>
              <a href="/help-public">{{ t('landing.footer.documentation') }}</a>
              <a href="https://usine.solution-libre.fr/open-course-factory/" target="_blank" rel="noopener noreferrer">
                <i class="fab fa-gitlab"></i> {{ t('landing.footer.gitlab') }}
              </a>
              <router-link to="/legal">{{ t('landing.footer.legal') }}</router-link>
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
import { onMounted, onUnmounted, ref } from 'vue'
import { useTranslations } from '../../composables/useTranslations'
import { useLocale } from '../../composables/useLocale'
import packageJson from '../../../package.json'

const { t } = useTranslations({
  en: {
    landing: {
      platformReady: 'Alpha • Launch Your Terminal Now',
      heroTitle: 'Level Up Your Shell',
      heroSubtitle: 'Master Linux commands in a secure, interactive environment. Access real terminals directly in your browser—no installation required.',
      login: 'Start Now',
      register: 'Start for Free',
      help: 'Documentation',
      browserBased: 'Browser-Based',
      zeroSetup: 'Zero Setup',
      safeExperiment: 'Break Without Risk',
      scrollDown: 'Discover more',
      backToTop: 'Back to top',

      features: {
        title: 'Why Choose Open Course Factory?',
        terminals: {
          title: 'Real Linux Terminals',
          description: 'Actual Linux distributions (Alpine, Debian, Ubuntu) accessible directly in your browser. Zero configuration required.',
          interactive: 'Launch terminal in seconds',
          sharing: 'Browser-based access, anywhere',
          ssh: 'Multiple distributions available',
          realTime: 'Secure, isolated sessions'
        },
        billing: {
          title: 'Safe Experimentation',
          description: 'Break things without risk! Ephemeral instances reset automatically, giving you freedom to learn and explore.',
          flexible: 'Instances reset after 15 minutes',
          plans: 'No damage to your system',
          invoices: 'Perfect for learning and testing',
          portal: 'Start fresh anytime'
        },
        i18n: {
          title: 'Instant Setup',
          description: 'No installation, no SSH keys, no hassle. Just click and start typing commands in a real Linux environment.',
          french: 'Zero configuration needed',
          english: 'Works on any modern browser',
          embedded: 'Authenticated user sessions',
          dynamic: 'Educational & professional use'
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
        title: 'Get Started in 3 Steps',
        step1: {
          title: 'Create Your Account',
          description: 'Quick signup—no credit card needed'
        },
        step2: {
          title: 'Launch a Terminal',
          description: 'Choose your distribution and start coding'
        },
        step3: {
          title: 'Learn & Experiment',
          description: 'Practice Linux commands without fear'
        }
      },

      footer: {
        description: 'Learn Linux commands in a secure, browser-based environment. Designed for students, trainers, and developers.',
        platform: 'Platform',
        features: 'Features',
        technology: 'Technology',
        getStarted: 'Get Started',
        resources: 'Resources',
        documentation: 'Documentation',
        gitlab: 'GitLab',
        legal: 'Legal Notices',
        rights: 'All rights reserved'
      }
    }
  },
  fr: {
    landing: {
      platformReady: 'Alpha • Lancez votre terminal maintenant',
      heroTitle: 'Montez en compétence',
      heroSubtitle: 'Maîtrisez les commandes Linux dans un environnement sécurisé et interactif. Accédez à de vrais terminaux directement dans votre navigateur — sans installation.',
      login: 'Commencer',
      register: 'Démarrer gratuitement',
      help: 'Documentation',
      browserBased: 'Dans le navigateur',
      zeroSetup: 'Zéro configuration',
      safeExperiment: 'Cassez sans risque',
      scrollDown: 'Découvrir plus',
      backToTop: 'Retour en haut',

      features: {
        title: 'Pourquoi choisir Open Course Factory ?',
        terminals: {
          title: 'Vrais terminaux Linux',
          description: 'Vraies distributions Linux (Alpine, Debian, Ubuntu) accessibles directement dans votre navigateur. Zéro configuration requise.',
          interactive: 'Lancez un terminal en quelques secondes',
          sharing: 'Accès depuis n\'importe quel navigateur',
          ssh: 'Plusieurs distributions disponibles',
          realTime: 'Sessions sécurisées et isolées'
        },
        billing: {
          title: 'Expérimentation sans risque',
          description: 'Cassez tout sans danger ! Les instances éphémères se réinitialisent automatiquement, vous donnant la liberté d\'apprendre.',
          flexible: 'Réinitialisation après 15 minutes',
          plans: 'Aucun dommage à votre système',
          invoices: 'Parfait pour l\'apprentissage',
          portal: 'Recommencez à zéro quand vous voulez'
        },
        i18n: {
          title: 'Configuration instantanée',
          description: 'Pas d\'installation, pas de clés SSH, pas de tracas. Cliquez et commencez à taper des commandes dans un vrai Linux.',
          french: 'Zéro configuration nécessaire',
          english: 'Fonctionne sur tout navigateur moderne',
          embedded: 'Sessions utilisateur authentifiées',
          dynamic: 'Usage éducatif & professionnel'
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
        title: 'Commencez en 3 étapes',
        step1: {
          title: 'Créez votre compte',
          description: 'Inscription rapide—sans carte bancaire'
        },
        step2: {
          title: 'Lancez un terminal',
          description: 'Choisissez votre distribution et codez'
        },
        step3: {
          title: 'Apprenez & expérimentez',
          description: 'Pratiquez les commandes Linux sans crainte'
        }
      },

      footer: {
        description: 'Apprenez les commandes Linux dans un environnement sécurisé accessible via navigateur. Conçu pour étudiants, formateurs et développeurs.',
        platform: 'Plateforme',
        features: 'Fonctionnalités',
        technology: 'Technologies',
        getStarted: 'Commencer',
        resources: 'Ressources',
        documentation: 'Documentation',
        gitlab: 'GitLab',
        legal: 'Mentions légales',
        rights: 'Tous droits réservés'
      }
    }
  }
})

const { currentLocale, setLocale } = useLocale()
const showScrollIndicator = ref(true)
const isAtBottom = ref(false)

const toggleLanguage = () => {
  const newLocale = currentLocale.value === 'en' ? 'fr' : 'en'
  setLocale(newLocale)
}

const scrollToSection = (selector: string) => {
  const element = document.querySelector(selector)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
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

onMounted(() => {
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
})

onUnmounted(() => {
  // Cleanup will be handled automatically by Vue
})
</script>

<style scoped>
/* Reset and base styles */
.landing-page {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: var(--color-text-primary);
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
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 50%, #f093fb 100%);
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
  color: var(--color-white);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 0 20px;
}

/* Animated background shapes */
.hero-bg-shapes {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  filter: blur(80px);
  animation: shapeFloat 20s ease-in-out infinite;
}

.shape-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  top: -10%;
  left: -10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(240,147,251,0.4) 0%, transparent 70%);
  bottom: -10%;
  right: -5%;
  animation-delay: 5s;
}

.shape-3 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(102,126,234,0.3) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 10s;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.3;
  animation: orbFloat 25s ease-in-out infinite;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--color-primary) 0%, transparent 70%);
  top: 20%;
  right: 10%;
  animation-delay: 2s;
}

.orb-2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, #f093fb 0%, transparent 70%);
  bottom: 30%;
  left: 15%;
  animation-delay: 7s;
}

.hero-content {
  max-width: 800px;
  text-align: center;
  z-index: 2;
  animation: fadeInUp 1s ease-out;
}

.hero-badge {
  margin-bottom: 30px;
}

.pulse-animation {
  animation: pulse 2s ease-in-out infinite;
}

.badge {
  background: rgba(255, 255, 255, 0.15);
  padding: 10px 24px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.5px;
}

.badge-icon {
  animation: sparkle 2s ease-in-out infinite;
}

.hero-title {
  font-size: 4.5rem;
  font-weight: 800;
  margin-bottom: 25px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.title-gradient {
  background: linear-gradient(135deg, var(--color-white) 0%, #f0f0f0 50%, var(--color-white) 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: textShimmer 3s ease-in-out infinite;
  text-shadow: 0 0 40px rgba(255, 255, 255, 0.3);
}

.hero-subtitle {
  font-size: 1.4rem;
  margin-bottom: 50px;
  opacity: 0.95;
  font-weight: 400;
  line-height: 1.6;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.cta-buttons {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 16px 38px;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.3px;
}

.btn i {
  transition: transform 0.4s ease;
}

.btn:hover i {
  transform: scale(1.2) rotate(5deg);
}

/* Primary Button with Glow Effect */
.btn-primary {
  background: linear-gradient(135deg, var(--color-white) 0%, var(--color-bg-tertiary) 100%);
  color: var(--color-primary);
  box-shadow: 0 10px 40px rgba(255, 255, 255, 0.3);
}

.glow-on-hover {
  position: relative;
}

.glow-on-hover::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50px;
  background: linear-gradient(45deg, var(--color-primary), var(--color-primary-hover), #f093fb, var(--color-primary));
  background-size: 400%;
  z-index: -1;
  filter: blur(8px);
  opacity: 0;
  transition: opacity 0.4s ease;
  animation: glowRotate 8s linear infinite;
}

.glow-on-hover:hover::before {
  opacity: 0.7;
}

.btn-primary:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 60px rgba(255, 255, 255, 0.4);
}

/* Glass Button */
.btn-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: var(--color-white);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.btn-glass:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(255, 255, 255, 0.2);
}

/* Outline Glow Button */
.btn-outline-glow {
  border: 2px solid rgba(255, 255, 255, 0.5);
  color: var(--color-white);
  background: transparent;
  position: relative;
}

.btn-outline-glow::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.btn-outline-glow:hover::after {
  opacity: 1;
}

.btn-outline-glow:hover {
  border-color: var(--color-white);
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(255, 255, 255, 0.3);
}


.hero-animation {
  position: absolute;
  right: 8%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
}

.floating-cards {
  position: relative;
}

.glass-card {
  background: rgba(255, 255, 255, 0.08);
  padding: 24px 28px;
  border-radius: 20px;
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  margin: 25px 0;
  animation: float 4s ease-in-out infinite;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 240px;
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(-10px) scale(1.05);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.3);
}

.card-icon {
  font-size: 2rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.card-text {
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.3px;
}

.card-1 { animation-delay: 0s; }
.card-2 { animation-delay: 1.3s; }
.card-3 { animation-delay: 2.6s; }

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
  background: linear-gradient(145deg, var(--color-primary) 0%, var(--color-primary-hover) 50%, var(--color-primary) 100%);
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
  border-top: 8px solid var(--color-white);
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
  transform: translateY(1px);
}

.css-triangle.up {
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 8px solid var(--color-white);
  filter: drop-shadow(0 -1px 3px rgba(0, 0, 0, 0.2));
  transform: translateY(-1px);
}

.floating-scroll-text {
  font-size: 11px;
  margin: 0;
  font-weight: 600;
  color: var(--color-white);
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
  color: var(--color-text-primary);
}

.section-subtitle {
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 60px;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}


/* Features Section */
.features-section {
  padding: 100px 0;
  background: linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%);
  position: relative;
}

.section-header {
  margin-bottom: 70px;
}

.title-underline {
  position: relative;
  display: inline-block;
  padding-bottom: 15px;
}

.title-underline::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), #f093fb);
  border-radius: 2px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.glass-effect {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.feature-card {
  padding: 45px 35px;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
}

.feature-card-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(240, 147, 251, 0.03) 100%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.feature-card:hover .feature-card-bg {
  opacity: 1;
}

.feature-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
}

.feature-icon {
  font-size: 4rem;
  margin-bottom: 25px;
  display: flex;
  justify-content: center;
}

.icon-float {
  animation: iconFloat 3s ease-in-out infinite;
}

.icon-glow {
  display: inline-block;
  filter: drop-shadow(0 0 20px rgba(102, 126, 234, 0.4));
  transition: filter 0.4s ease;
}

.feature-card:hover .icon-glow {
  filter: drop-shadow(0 0 30px rgba(102, 126, 234, 0.6));
  animation: iconBounce 0.6s ease;
}

.feature-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 15px;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.feature-desc {
  color: var(--color-text-secondary);
  margin-bottom: 25px;
  line-height: 1.7;
  font-size: 1rem;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  padding: 12px 0;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.feature-list li:hover {
  color: var(--color-text-primary);
  transform: translateX(5px);
}

.check-icon {
  font-size: 0.9rem;
  opacity: 0.7;
  transition: all 0.3s ease;
}

.feature-list li:hover .check-icon {
  opacity: 1;
  transform: scale(1.2);
}

/* Technology Section */
.tech-section {
  padding: 80px 0;
  background: var(--color-bg-dark);
  color: var(--color-white);
}

.tech-section .section-title,
.tech-section .section-subtitle {
  color: var(--color-white);
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
  color: var(--color-white);
}

.tech-card p {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  opacity: 0.9;
}


/* Getting Started Section */
.getting-started-section {
  padding: 80px 0;
  background: var(--color-bg-tertiary);
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
  background: var(--color-primary);
  color: var(--color-white);
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
  color: var(--color-text-primary);
}

.step p {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* Footer */
.footer-section {
  background: var(--color-bg-dark);
  color: var(--color-white);
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
  color: var(--color-white);
}

.footer-brand p {
  color: var(--color-text-muted);
  line-height: 1.6;
  opacity: 0.9;
}

.footer-contact {
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-contact a {
  color: var(--color-primary);
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
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: var(--color-white);
}

.link-group a {
  display: block;
  color: var(--color-text-muted);
  text-decoration: none;
  padding: 5px 0;
  transition: color 0.3s ease;
  opacity: 0.9;
}

.link-group a:hover {
  color: var(--color-primary);
  opacity: 1;
}

.footer-bottom {
  border-top: 1px solid var(--color-border-dark);
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  color: var(--color-text-muted);
  opacity: 0.9;
}

.version {
  color: var(--color-text-muted);
  font-weight: normal;
  opacity: 0.8;
}

.language-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--color-white);
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
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes shapeFloat {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(30px, -30px) rotate(120deg);
  }
  66% {
    transform: translate(-30px, 20px) rotate(240deg);
  }
}

@keyframes orbFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(40px, -40px) scale(1.1);
  }
  66% {
    transform: translate(-40px, 30px) scale(0.9);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2) rotate(90deg);
  }
}

@keyframes textShimmer {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes glowRotate {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(2deg);
  }
}

@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes iconBounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15) rotate(5deg);
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

/* Dark Mode Adjustments */
:global([data-theme="dark"]) .tech-section {
  background: var(--color-bg-secondary);
}

:global([data-theme="dark"]) .footer-section {
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-border-medium);
}

:global([data-theme="dark"]) .glass-effect {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

:global([data-theme="dark"]) .glass-card {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
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
