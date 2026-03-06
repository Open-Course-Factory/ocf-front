<script setup lang="ts">
import Entity from '../Entity.vue'
import { useScenarioStepsStore } from '../../../stores/scenarioSteps'

const entityStore = useScenarioStepsStore()
</script>

<template>
    <div class="wrapper">
        <Entity
            :entity-name="'scenario-steps'"
            :entity-store="entityStore"
        />
    </div>
</template>
