<script setup lang="ts">

import { useCurrentUserStore } from '../../store/currentUser.ts';

const currentUser = useCurrentUserStore();

</script>

<template>
    <div class="top-menu">

    </div>
</template>

<style scoped>

.top-menu {
    width: 100%;
    height: 60px;
    border-bottom: 1px solid #D9DEE4;
    background-color: #fff;
}

</style>