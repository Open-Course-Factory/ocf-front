<!--
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
 */
-->

<template>
  <div class="settings-page-wrapper">
    <SSHKeysSettings />
  </div>
</template>

<script setup lang="ts">
import SSHKeysSettings from '../../Settings/SSHKeysSettings.vue'
</script>

<style scoped>
.settings-page-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
