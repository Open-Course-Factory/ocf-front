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

import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useCurrentUserStore } from '../store/currentUser'
import Login from '../components/Pages/Login.vue'
import Dashboard from '../components/Pages/Dashboard.vue'
import Courses from '../components/Pages/Courses.vue'
import Tps from '../components/Pages/Tps.vue'
import Schedule from '../components/Pages/Schedule.vue'
import User from '../components/Pages/User.vue'
import CourseDetails from '../components/Pages/CourseDetails.vue'
import Dial from '../components/WebSsh/Dial.vue'
import WebSsh from '../components/WebSsh/WebSsh.vue'
import Machines from '../components/Pages/Machines.vue'
import MachineDetails from '../components/Pages/MachineDetails.vue'

const basicRoutes = [
    { path: '/login', name: 'Login', component: Login, props: true },
    { path: '/dashboard', name: 'Dashboard', component: Dashboard, props: true, meta: { requiresAuth: true } },
    { path: '/courses', name: 'Course', component: Courses, props: true, meta: { requiresAuth: true } },
    { 
        path: '/tps', 
        // name: 'TPs', 
        component: Tps, 
        // props: true, 
        meta: { 
            requiresAuth: true 
        },
        children: [
            {
                path: "",
                component: WebSsh,
            },
            {
                path: "dial",
                component: Dial,
            },
        ],
    },
    { path: '/schedule', name: 'Schedule', component: Schedule, props: true, meta: { requiresAuth: true } },
    { path: '/user', name: 'user', component: User, props: true, meta: { requiresAuth: true } },
    { path: '/course/:id', component: CourseDetails, props: true, meta: { requiresAuth: true } },
    { 
        path: '/machines', 
        meta: { 
            requiresAuth: true 
        },
        children: [
            {
                path: "",
                component: Machines,
            },
            {
                path: ":id",
                component: MachineDetails,
            },
        ],
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes: basicRoutes as RouteRecordRaw[]
})

router.beforeEach((to, from, next) => {
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

export default router 