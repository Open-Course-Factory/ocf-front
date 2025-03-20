<template>
  <div class="wrapper">
    <MainNavMenu class="main-nav-menu" :class="{ collapsed: isMenuCollapsed }" />
    <div class="inner-wrapper" :class="{ 'menu-collapsed': isMenuCollapsed }">
      <TopMenu @toggle-menu="toggleMenu" />
      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import MainNavMenu from './Menus/MainNavMenu.vue';
import TopMenu from './Menus/TopMenu.vue';

const isMenuCollapsed = ref(false);

function toggleMenu() {
  isMenuCollapsed.value = !isMenuCollapsed.value;
}

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
  overflow-y: hidden;
  background-color: #343a40; /* Match your menu background color */
  z-index: 999; /* Ensure it stays above other content */
  transition: width 0.3s ease;
}

.main-nav-menu.collapsed {
  width: 60px; /* Width of the icons */
}

.inner-wrapper {
  margin-left: 250px; /* Same width as the MainNavMenu */
  display: flex;
  flex-direction: column;
  width: calc(100% - 250px); /* Adjust width to account for the MainNavMenu */
  padding-top: 60px; /* Height of the TopMenu */
  overflow-y: auto;
  padding: 10px;
  animation: fadeIn 0.5s ease-in-out;
  transition: margin-left 0.3s ease, width 0.3s ease;
  margin-top: 60px;
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
  overflow: hidden; /* Hide scrollbars */
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
