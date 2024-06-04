<script setup lang="ts">

function startNewSession() {
    try {
        
    } catch (error) {
        console.error('Error while getting creating new session:', error)
    }
}

</script>

<template>
    <Button @click="startNewSession">Lancer une session</Button>
</template>