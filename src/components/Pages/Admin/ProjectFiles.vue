<script setup lang="ts">
import Entity from '../Entity.vue'
import { useProjectFilesStore } from '../../../stores/projectFiles'

const entityStore = useProjectFilesStore()
</script>

<template>
    <div class="wrapper">
        <Entity
            :entity-name="'project-files'"
            :entity-store="entityStore"
        />
    </div>
</template>
