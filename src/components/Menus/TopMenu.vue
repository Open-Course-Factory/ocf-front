<script setup lang="ts">

import { useCurrentUserStore } from '../../store/currentUser.ts';

const currentUser = useCurrentUserStore();

</script>

<template>
    <div class="top-menu">

            <router-link to="/user">
                <div class="profile-picture"></div>
                <p>{{ currentUser.userName }}</p>
            </router-link>

    </div>
</template>

<style scoped>

.top-menu {
    display: flex;
    justify-content: end;
    align-items: center;
    width: 100%;
    height: 60px;
    border-bottom: 1px solid #D9DEE4;
    background-color: #fff;
}

p {
    margin-top: 14px;
}

.top-menu a {
    width: 130px;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0px 14px;
    cursor: pointer;
    margin-right: 50px;
    color: #212529;
    text-decoration: none;
}

.profile-picture {
    width: 40px;
    height: 40px;
    background-color: #969696;
    border-radius: 50%;
}

</style>