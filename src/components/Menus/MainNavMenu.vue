<template>
    <div class="main-menu">
      <header class="menu-header">
        <h1>
          <router-link to="/courses">COurse NEXus</router-link>
        </h1>
        <p class="user-role">{{ currentUser.userRoles[0] }}</p>
      </header>
      <nav class="menu-nav">
        <ul>
          <li>
            <router-link to="/courses">
              <i class="fas fa-book"></i> Courses
            </router-link>
          </li>
          <li>
            <router-link to="/chapters">
              <i class="fas fa-book-open"></i> Chapters
            </router-link>
          </li>
          <li>
            <router-link to="/sections">
              <i class="fas fa-stream"></i> Sections
            </router-link>
          </li>
          <li>
            <router-link to="/pages">
              <i class="fas fa-file-alt"></i> Pages
            </router-link>
          </li>
          <li>
            <router-link to="/schedules">
              <i class="fas fa-calendar-alt"></i> Schedules
            </router-link>
          </li>
          <li>
            <router-link to="/tps">
              <i class="fas fa-laptop-code"></i> TPs
            </router-link>
          </li>
          <li v-if="currentUser.userRoles[0] === 'administrator'">
            <router-link to="/usernames">
              <i class="fas fa-users"></i> Noms d'utilisateurs
            </router-link>
          </li>
          <li v-if="currentUser.userRoles[0] === 'administrator'">
            <router-link to="/machines">
              <i class="fas fa-desktop"></i> Machines
            </router-link>
          </li>
          <li v-if="currentUser.userRoles[0] === 'administrator'">
            <router-link to="/connections">
              <i class="fas fa-plug"></i> Connections
            </router-link>
          </li>
        </ul>
      </nav>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useCurrentUserStore } from '../../store/currentUser.ts';
  
  const currentUser = useCurrentUserStore();
  </script>
  
  <style scoped>
  .main-menu {
    background-color: #343a40;
    color: #e7e7e7;
    height: 100vh;
    padding: 20px;
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .menu-header {
    margin-bottom: 30px;
  }
  
  .menu-header h1 a {
    font-size: 2rem;
    color: #e7e7e7;
    text-decoration: none;
  }
  
  .user-role {
    font-size: 0.875rem;
    text-transform: uppercase;
    margin-left: 20px;
  }
  
  .menu-nav ul {
    list-style-type: none;
    padding: 0;
  }
  
  .menu-nav ul li a {
    display: flex;
    align-items: center;
    padding: 15px;
    color: #e7e7e7;
    text-decoration: none;
    border-radius: 4px;
    margin-bottom: 5px;
    transition: background-color 0.3s, transform 0.3s;
  }
  
  .menu-nav ul li a:hover {
    background-color: #495057;
    transform: translateX(5px);
  }
  
  .menu-nav ul li a i {
    margin-right: 10px;
    width: 20px;
    text-align: center;
  }
  
  </style>
  