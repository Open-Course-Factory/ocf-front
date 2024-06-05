<script setup lang="ts">
import { useCoursesStore } from '../../store/courses';

const course = useCoursesStore()
</script>

<template>
    <p>{{ course.courses }}</p>
</template>