<template>
  <div class="wrapper">
    <MainNavMenu class="main-nav-menu" />
    <div class="inner-wrapper">
      <TopMenu />
      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MainNavMenu from './Menus/MainNavMenu.vue';
import TopMenu from './Menus/TopMenu.vue';
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
  overflow-y: auto;
  background-color: #343a40; /* Match your menu background color */
  z-index: 999; /* Ensure it stays above other content */
}

.inner-wrapper {
  margin-left: 250px; /* Same width as the MainNavMenu */
  display: flex;
  flex-direction: column;
  width: calc(100% - 250px); /* Adjust width to account for the MainNavMenu */
  padding-top: 60px; /* Height of the TopMenu */
  overflow-y: auto;
  padding: 20px;
  animation: fadeIn 0.5s ease-in-out;
}

.content-area {
  flex-grow: 1;
  padding: 60px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
