<script setup lang="ts">
import MainNavMenu from '../Menus/MainNavMenu.vue';
import TopMenu from '../Menus/TopMenu.vue';
// import axios from 'axios';
// import { onBeforeMount } from 'vue';
// import { useCurrentUserStore } from '../../store/currentUser';
// // import { useCoursesStore } from '../../store/courses';

// const currentUser = useCurrentUserStore()

// onBeforeMount(() => getCourses())

// async function getCourses() {
//     try {
//         const responseCourses = await axios.get('http://localhost:8080/api/v1/courses/', {
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//                 'Content-Type': 'application/json',
//                 'Authorization': currentUser.secretToken
//             }
//         })
//         console.log(responseCourses);
//     } catch (error) {
//         console.error('Error while getting courses:', error)
//     }
// }

</script>

<template>
    <div class="wrapper">
        <MainNavMenu />
        <div class="inner-wrapper">
            <TopMenu />
            <section class="cards-list">
                <h2>Cours actuels</h2>
                <div class="cards-body">
                    <div class="card">
                        <!-- 
                            TO DO : v-if cards = display cards v-else = display 'aucun cours à afficher' 
                                    v-for card in cards = display cards
                        -->
                    </div>
                    <div class="card">

                    </div>
                    <div class="card">

                    </div>
                </div>
            </section>
            <section class="cards-list">
                <h2>Anciens cours</h2>
                <div class="cards-body">
                    <div class="card">

                    </div>
                    <div class="card">

                    </div>
                    <div class="card">

                    </div>
                </div>
            </section>
            <section class="cards-list">
                <h2>Cours à venir</h2>
                <div class="cards-body">
                    <div class="card">

                    </div>
                    <div class="card">

                    </div>
                    <div class="card">

                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<style>

.card {
    width: 150px;
    height: 100px;
    background-color: #494949;
    margin-right: 10px;

}

.cards-body {
    display: flex;
}

.cards-list {
    background-color: #e4e4e4;
    margin-top: 30px;
    margin-left: 30px;
    padding: 16px;
    border-radius: var(--bs-border-radius);
    width: 1000px;
}

</style>