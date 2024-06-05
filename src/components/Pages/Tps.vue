<script setup lang="ts">
import MainNavMenu from '../Menus/MainNavMenu.vue';
import TopMenu from '../Menus/TopMenu.vue';
import StartSession from '../Buttons/StartSession.vue';
import GuacConnect from '../Guacamole/GuacConnect.vue'
</script>

<template>
    <div class="wrapper">
        <MainNavMenu />
        <div class="inner-wrapper">
            <TopMenu />
            <StartSession />
            <GuacConnect />

        </div>
    </div>
</template>