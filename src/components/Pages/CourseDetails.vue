<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useCoursesStore } from '../../store/courses'
import MainNavMenu from '../Menus/MainNavMenu.vue'
import TopMenu from '../Menus/TopMenu.vue'

const route = useRoute()
const courseStore = useCoursesStore()

const course = computed(() => {
    return courseStore.courses.find(c => c.CourseID_str === route.params.id)
})
</script>

<template>
    <div class="wrapper">
        <MainNavMenu />
        <div class="inner-wrapper">
            <TopMenu />
            <div class="page-content" v-if="course">
                <div class="page-header">
                    <h2>{{ course.Name }}</h2>
                    <p>Auteur de ce cours : {{ course.AuthorEmail }}</p>
                </div>
                <p>{{ course.Description }}</p>
            </div>
            <div v-else>
                <p>Le cours n'a pas été trouvé.</p>
            </div>
        </div>
    </div>
</template>

<style>

.page-content {
    width: 100%;
    margin: 30px 80px;
}

.page-header {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

</style>
