<script setup lang="ts">
import Entity from './Entity.vue'
import { usePlanFeaturesStore } from '../../stores/planFeatures'

const entityStore = usePlanFeaturesStore()
</script>

<template>
    <div class="wrapper">
        <Entity
            :entity-name="'PlanFeature'"
            :entity-store="entityStore"
        />
    </div>
</template>
