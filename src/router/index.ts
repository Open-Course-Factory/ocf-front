import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Pages/Login.vue'
import Dashboard from '../components/Dashboard.vue'
import Courses from '../components/Pages/Courses.vue'
import Tps from '../components/Pages/Tps.vue'
import Schedule from '../components/Pages/Schedule.vue'

const routes = [
    { path: '/login', name: 'Login', component: Login, props: true },
    { path: '/dashboard', name: 'Dashboard', component: Dashboard, props: true },
    { path: '/courses', name: 'Course', component: Courses, props: true },
    { path: '/tps', name: 'TPs', component: Tps, props: true },
    { path: '/schedule', name: 'Schedule', component: Schedule, props: true }
]
const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router 