<script setup lang="ts">
import Entity from '../Entity.vue'
import { useScenarioStepHintsStore } from '../../../stores/scenarioStepHints'

const entityStore = useScenarioStepHintsStore()
</script>

<template>
    <div class="wrapper">
        <Entity
            :entity-name="'scenario-step-hints'"
            :entity-store="entityStore"
        />
    </div>
</template>
