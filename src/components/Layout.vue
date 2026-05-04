<template>
  <div class="layout-root">
    <ImpersonationBanner />
    <div class="wrapper">
    <DemoModeBanner />
    <AdminNavMenu
      v-if="isInAdmin"
      class="main-nav-menu"
      :class="{ collapsed: isMenuCollapsed }"
      :isMenuCollapsed="isMenuCollapsed"
    />
    <PreferencesNavMenu
      v-else-if="isInSettings"
      class="main-nav-menu"
      :class="{ collapsed: isMenuCollapsed }"
      :isMenuCollapsed="isMenuCollapsed"
    />
    <MainNavMenu
      v-else
      class="main-nav-menu"
      :class="{ collapsed: isMenuCollapsed }"
      :isMenuCollapsed="isMenuCollapsed"
    />
    <div class="inner-wrapper" :class="{ 'menu-collapsed': isMenuCollapsed }">
      <TopMenu
        @toggle-menu="toggleMenu"
      />
      <div class="content-area">
        <EmailVerificationBanner />
        <router-view :key="route.fullPath" />
      </div>
    </div>
    <ToastContainer />
    <FeedbackButton />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminNavMenu from './Menus/AdminNavMenu.vue'
import MainNavMenu from './Menus/MainNavMenu.vue'
import PreferencesNavMenu from './Menus/PreferencesNavMenu.vue'
import TopMenu from './Menus/TopMenu.vue'
import DemoModeBanner from './UI/DemoModeBanner.vue'
import ImpersonationBanner from './UI/ImpersonationBanner.vue'
import ToastContainer from './UI/ToastContainer.vue'
import FeedbackButton from './Feedback/FeedbackButton.vue'
import EmailVerificationBanner from './Auth/EmailVerificationBanner.vue'
import { useUserSettingsStore } from '../stores/userSettings'
import { useLocale } from '../composables/useLocale'
import { useTheme } from '../composables/useTheme'

const route = useRoute()
const isMenuCollapsed = ref(false);
const settingsStore = useUserSettingsStore()
const { setLocale } = useLocale()
const { setTheme } = useTheme()

// Check if we're in a settings route
const isInSettings = computed(() => route.meta.isSettings === true)

// Check if we're in an admin route
const isInAdmin = computed(() =>
  route.path.startsWith('/admin') || route.path.startsWith('/debug')
)

// Watch for route changes with collapseNav meta
watch(() => route.meta.collapseNav, (shouldCollapse) => {
  if (shouldCollapse === true) {
    isMenuCollapsed.value = true
  }
}, { immediate: true })

function toggleMenu() {
  isMenuCollapsed.value = !isMenuCollapsed.value;
}

// Load and apply user settings when component mounts
async function loadAndApplySettings() {
  try {
    const settings = await settingsStore.loadSettings()

    // Apply language if set
    if (settings.preferred_language) {
      setLocale(settings.preferred_language)
    }

    // Apply theme if set
    if (settings.theme) {
      setTheme(settings.theme as 'light' | 'dark' | 'auto')
    }
  } catch (error) {
    console.error('Error loading user settings:', error)
    // Don't show error toast on app load, just log it
  }
}

onMounted(() => {
  loadAndApplySettings()
})

function handleResize() {
  // Don't auto-expand menu on large screens if route has collapseNav meta
  if (window.innerWidth <= 768 && !isMenuCollapsed.value) {
    isMenuCollapsed.value = true;
  } else if (window.innerWidth > 768 && isMenuCollapsed.value && !route.meta.collapseNav) {
    isMenuCollapsed.value = false;
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize(); // Check the initial screen size
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* Outer flex-column so the impersonation banner sits above the row layout
   without competing for horizontal space with the side nav. */
.layout-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.wrapper {
  display: flex;
  flex: 1;
  min-height: 0; /* allow children to shrink within flex column */
}

.main-nav-menu {
  position: fixed;
  /* Sit just below the TopMenu, which itself shifts down by the
     impersonation banner height when active. */
  top: calc(60px + var(--impersonation-banner-height, 0px));
  left: 0;
  height: calc(100vh - 60px - var(--impersonation-banner-height, 0px));
  width: 250px; /* Adjust width as needed */
  overflow-y: auto; /* Allow scrolling within the menu */
  background-color: var(--color-bg-dark);
  z-index: 999; /* Ensure it stays above other content */
  transition: width var(--transition-base) ease;
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
}

.main-nav-menu.collapsed {
  width: 60px;
  padding: 10px;
}

.inner-wrapper {
  margin-left: 250px; /* Same width as the MainNavMenu */
  display: flex;
  flex-direction: column;
  width: calc(100% - 250px); /* Adjust width to account for the MainNavMenu */
  animation: fadeIn 0.5s ease-in-out;
  transition: margin-left 0.3s ease, width 0.3s ease;
  overflow-y: auto; /* Allow scrolling within the content area */
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
}

.inner-wrapper.menu-collapsed {
  margin-left: 60px; /* Width of the icons */
  width: calc(100% - 60px);
}

.content-area {
  flex-grow: 1;
  padding: 0px var(--spacing-lg);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  overflow-y: auto; /* Allow scrolling within the content area */
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
  /* Clear the fixed TopMenu, which itself shifts down by the impersonation
     banner height when active. */
  margin-top: calc(60px + var(--impersonation-banner-height, 0px));
}

/* Hide scrollbars for WebKit browsers */
.inner-wrapper::-webkit-scrollbar,
.content-area::-webkit-scrollbar {
  display: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>