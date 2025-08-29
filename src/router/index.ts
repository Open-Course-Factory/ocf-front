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

import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useCurrentUserStore } from '../stores/currentUser';
import Layout from '../components/Layout.vue';
import Courses from '../components/Pages/Courses.vue';
import Chapters from '../components/Pages/Chapters.vue';
import Sections from '../components/Pages/Sections.vue';
import Pages from '../components/Pages/Pages.vue';
import Schedules from '../components/Pages/Schedules.vue';
import CourseDetails from '../components/Pages/CourseDetails.vue';
import LandingPage from '../components/Pages/LandingPage.vue';
import User from '../components/Pages/User.vue';
import Generations from '../components/Pages/Generations.vue';
import Themes from '../components/Pages/Themes.vue';
import Terminals from '../components/Pages/TerminalsSimple.vue';
import UserTerminalKeys from '../components/Pages/UserTerminalKeysSimple.vue';

const basicRoutes = [
  { path: '/', name: 'LandingPage', component: LandingPage },
  { path: '/login', name: 'Login', component: () => import('../components/Pages/Login.vue') },
  { 
    path: '/register', 
    name: 'Register', 
    component: () => import('../components/Pages/Register.vue')
  },
  { 
    path: '/password-reset', 
    name: 'PasswordReset', 
    component: () => import('../components/Pages/PasswordReset.vue')
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      //{ path: 'dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
      { path: 'courses', name: 'Courses', component: Courses, meta: { requiresAuth: true } },
      { path: 'chapters', name: 'Chapters', component: Chapters, meta: { requiresAuth: true } },
      { path: 'sections', name: 'Sections', component: Sections, meta: { requiresAuth: true } },
      { path: 'pages', name: 'Pages', component: Pages, meta: { requiresAuth: true } },
      { path: 'schedules', name: 'Schedules', component: Schedules, meta: { requiresAuth: true } },
      { path: 'themes', name: 'Themes', component: Themes, meta: { requiresAuth: true } },
      { path: 'generations', name: 'Generations', component: Generations, meta: { requiresAuth: true } },
      { path: 'terminals', name: 'Terminals', component: Terminals, meta: { requiresAuth: true } },
      { path: 'user-terminal-keys', name: 'UserTerminalKeys', component: UserTerminalKeys, meta: { requiresAuth: true } },
      { path: 'course/:id', component: CourseDetails, meta: { requiresAuth: true } },
      {
        path: 'user',
        meta: { requiresAuth: true },
        children: [{ path: '', component: User }],
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: basicRoutes as RouteRecordRaw[],
});

router.beforeEach((to, _from, next) => {
  const currentUserStore = useCurrentUserStore();

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!currentUserStore.isAuthenticated) {
      next({ name: 'Login' });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
