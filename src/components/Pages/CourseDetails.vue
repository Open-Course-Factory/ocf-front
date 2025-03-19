<!-- 
/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2024 Solution Libre
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Copyright (c) - All Rights Reserved.
 * 
 * See the LICENSE file for more information.
 */ 
-->

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useCoursesStore } from '../../store/courses'

const route = useRoute()
const courseStore = useCoursesStore()

const course = computed(() => {
    return courseStore.entities.find(c => c.CourseID_str === route.params.id)
})
</script>

<template>
    <div class="wrapper">
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
