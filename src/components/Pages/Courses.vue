<script setup lang="ts">
import Dashboard from '../Dashboard.vue';
import TopMenu from '../Menus/TopMenu.vue';
</script>

<template>
    <div class="wrapper" style="display: flex; height: 100%; width: 100%;">
        <Dashboard />
        <div style="width: 100%; background-color: #f7f7f7;">
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