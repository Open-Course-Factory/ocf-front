<script setup lang="ts">
import Entity from '../Entity.vue'
import { useScenarioSessionsStore } from '../../../stores/scenarioSessions'

const entityStore = useScenarioSessionsStore()
</script>

<template>
    <div class="wrapper">
        <Entity
            :entity-name="'scenario-sessions'"
            :entity-store="entityStore"
        />
    </div>
</template>
