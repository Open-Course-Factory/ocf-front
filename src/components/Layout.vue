<template>
  <div class="wrapper">
    <DemoModeBanner />
    <!-- Show SettingsNavMenu when in settings routes, otherwise MainNavMenu -->
    <SettingsNavMenu
      v-if="isInSettings"
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
        <router-view :key="route.fullPath" />
      </div>
    </div>
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import MainNavMenu from './Menus/MainNavMenu.vue'
import SettingsNavMenu from './Menus/SettingsNavMenu.vue'
import TopMenu from './Menus/TopMenu.vue'
import DemoModeBanner from './UI/DemoModeBanner.vue'
import ToastContainer from './UI/ToastContainer.vue'
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
  if (window.innerWidth <= 768 && !isMenuCollapsed.value) {
    isMenuCollapsed.value = true;
  } else if (window.innerWidth > 768 && isMenuCollapsed.value) {
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
.wrapper {
  display: flex;
  height: 100vh;
}

.main-nav-menu {
  position: fixed;
  top: 60px; /* Height of the TopMenu */
  left: 0;
  height: calc(100vh - 60px); /* Full height minus the TopMenu height */
  width: 250px; /* Adjust width as needed */
  overflow-y: auto; /* Allow scrolling within the menu */
  background-color: #343a40; /* Match your menu background color */
  z-index: 999; /* Ensure it stays above other content */
  transition: width 0.3s ease;
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
  padding: 0px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-y: auto; /* Allow scrolling within the content area */
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
  margin-top: 60px;
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