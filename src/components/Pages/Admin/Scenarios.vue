<script setup lang="ts">
import Entity from '../Entity.vue'
import { useScenariosStore } from '../../../stores/scenarios'

const entityStore = useScenariosStore()
</script>

<template>
    <div class="wrapper">
        <Entity
            :entity-name="'scenarios'"
            :entity-store="entityStore"
        />
    </div>
</template>
