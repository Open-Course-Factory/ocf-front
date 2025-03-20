<template>
  <div class="main-menu" :class="{ collapsed: isMenuCollapsed }">
    <header class="menu-header">
      <h1>
        <router-link to="/courses">
          <i class="fas fa-book"></i>
          <span class="menu-text">OCF</span>
        </router-link>
      </h1>
      <p class="user-role">{{ currentUser.userRoles[0] }}</p>
    </header>
    <nav class="menu-nav">
      <ul>
        <li>
          <router-link to="/courses" class="menu-item" title="Courses">
            <i class="fas fa-book"></i>
            <span class="menu-text">Courses</span>
          </router-link>
        </li>
        <li>
          <router-link to="/chapters" class="menu-item" title="Chapters">
            <i class="fas fa-book-open"></i>
            <span class="menu-text">Chapters</span>
          </router-link>
        </li>
        <li>
          <router-link to="/sections" class="menu-item" title="Sections">
            <i class="fas fa-stream"></i>
            <span class="menu-text">Sections</span>
          </router-link>
        </li>
        <li>
          <router-link to="/pages" class="menu-item" title="Pages">
            <i class="fas fa-file-alt"></i>
            <span class="menu-text">Pages</span>
          </router-link>
        </li>
        <li>
          <router-link to="/schedules" class="menu-item" title="Schedules">
            <i class="fas fa-calendar-alt"></i>
            <span class="menu-text">Schedules</span>
          </router-link>
        </li>
        <li>
          <router-link to="/tps" class="menu-item" title="TPs">
            <i class="fas fa-laptop-code"></i>
            <span class="menu-text">TPs</span>
          </router-link>
        </li>
        <li v-if="currentUser.userRoles[0] === 'administrator'">
          <router-link to="/usernames" class="menu-item" title="Noms d'utilisateurs">
            <i class="fas fa-users"></i>
            <span class="menu-text">Noms d'utilisateurs</span>
          </router-link>
        </li>
        <li v-if="currentUser.userRoles[0] === 'administrator'">
          <router-link to="/machines" class="menu-item" title="Machines">
            <i class="fas fa-desktop"></i>
            <span class="menu-text">Machines</span>
          </router-link>
        </li>
        <li v-if="currentUser.userRoles[0] === 'administrator'">
          <router-link to="/connections" class="menu-item" title="Connections">
            <i class="fas fa-plug"></i>
            <span class="menu-text">Connections</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useCurrentUserStore } from '../../store/currentUser.ts';
import { ref } from 'vue';

const currentUser = useCurrentUserStore();
const isMenuCollapsed = ref(false);
</script>

<style scoped>
.main-menu {
  background-color: #343a40;
  color: #e7e7e7;
  height: 100vh;
  padding: 20px;
  animation: fadeIn 0.5s ease-in-out;
  transition: width 0.3s ease;
  overflow: hidden; /* Hide scrollbars */
}

.main-menu.collapsed {
  width: 60px;
}

.menu-header {
  margin-bottom: 30px;
}

.menu-header h1 a {
  font-size: 2rem;
  color: #e7e7e7;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.menu-header h1 a .menu-text {
  display: inline;
  transition: opacity 0.3s ease;
  margin-left: 20px;
}

.main-menu.collapsed .menu-header h1 a {
  flex-direction: column;
  align-items: center;
}

.main-menu.collapsed .menu-header h1 a .menu-text {
  opacity: 0;
  width: 0;
}

.user-role {
  font-size: 0.875rem;
  text-transform: uppercase;
  margin-left: 20px;
  transition: opacity 0.3s ease;
}

.main-menu.collapsed .user-role {
  opacity: 0;
  width: 0;
}

.menu-nav ul {
  list-style-type: none;
  padding: 0;
}

.menu-nav ul li a {
  display: flex;
  height: 50px;
  align-items: center;
  padding: 15px;
  color: #e7e7e7;
  text-decoration: none;
  border-radius: 4px;
  margin-bottom: 5px;
  transition: background-color 0.3s, transform 0.3s;
  position: relative;
}

.menu-nav ul li a:hover {
  background-color: #495057;
  transform: translateX(5px);
}

.menu-nav ul li a i {
  width: 20px;
  text-align: center;
  margin:0px 10px;
}

.menu-nav ul li a .menu-text {
  transition: opacity 0.3s ease;
}

.main-menu.collapsed .menu-nav ul li a {
  padding: 10px; /* Adjust padding for collapsed view */
  justify-content: center;
}

.main-menu.collapsed .menu-nav ul li a .menu-text {
  opacity: 0;
  width: 0;
}

.main-menu.collapsed .menu-nav ul li a:hover::after {
  content: attr(title);
  position: absolute;
  left: 70px; /* Adjust based on icon width */
  top: 50%;
  transform: translateY(-50%);
  background-color: #343a40;
  color: #e7e7e7;
  padding: 5px 10px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.content-area {
  overflow: hidden; /* Hide scrollbars */
}
</style>
