<script setup lang="ts">

import { useCurrentUserStore } from '../../store/currentUser.ts';

const currentUser = useCurrentUserStore();

</script>

<template>
    <div class="top-menu">
        <div class="user-info">
            <router-link to="/user">
                <div class="profile-picture"></div>
                <p>{{ currentUser.userName }}</p>
            </router-link>
        </div>
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

.user-info a {
    width: 150px;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0px 14px;
    cursor: pointer;
    margin-right: 50px;
    color: #212529;
}

.profile-picture {
    width: 40px;
    height: 40px;
    background-color: #c93535;
    border-radius: 50%;
}

</style>