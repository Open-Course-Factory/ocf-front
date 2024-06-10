<script setup lang="ts">
// import router from "../router/index.ts"
import { useCurrentUserStore } from '../../store/currentUser.ts';

const currentUser = useCurrentUserStore();


</script>

<template>
    <div class="left-col">
        <h1>
            <router-link to="/dashboard">COurse NEXus</router-link>
        </h1>
        <p>{{ currentUser.userRoles[0] }}</p>
        <nav>
            <ul>
                <li>
                    <router-link to="/courses">Courses</router-link>
                </li>
                <li>
                    <router-link to="/tps">TPs</router-link>
                </li>
                <li>
                    <router-link to="/schedule">Emploi du temps</router-link>
                </li>
            </ul>
        </nav>
    </div>
</template>

<style scoped>

p {
  margin-left: 20px;
  font-size: 12px;
  font-size: 1rem;
  text-transform: uppercase;
}

a {
  color: #e7e7e7;
  text-decoration: none;
}

h1 a {
  font-size: 26px;
  margin-left: 20px;
}

ul {
  list-style-type: none;
  margin-left: -32px;
}

ul li a {
  padding: 13px 15px 12px 15px;
  display: block;
  cursor: pointer;
  margin-bottom: 6px;
}

ul li:hover,
ul li:focus {
  background-color: #45484e;
}

</style>