import { createRouter, createWebHistory } from 'vue-router'
import { useCurrentUserStore } from '../store/currentUser'
import Login from '../components/Pages/Login.vue'
import Dashboard from '../components/Pages/Dashboard.vue'
import Courses from '../components/Pages/Courses.vue'
import Tps from '../components/Pages/Tps.vue'
import Schedule from '../components/Pages/Schedule.vue'
import User from '../components/Pages/User.vue'
import CourseDetails from '../components/Pages/CourseDetails.vue'

const routes = [
    { path: '/login', name: 'Login', component: Login, props: true },
    { path: '/dashboard', name: 'Dashboard', component: Dashboard, props: true, meta: { requiresAuth: true } },
    { path: '/courses', name: 'Course', component: Courses, props: true, meta: { requiresAuth: true } },
    { path: '/tps', name: 'TPs', component: Tps, props: true, meta: { requiresAuth: true } },
    { path: '/schedule', name: 'Schedule', component: Schedule, props: true, meta: { requiresAuth: true } },
    { path: '/user', name: 'user', component: User, props: true, meta: { requiresAuth: true } },
    { path: '/course/:id', component: CourseDetails, props: true, meta: { requiresAuth: true } }
]
const router = createRouter({
    history: createWebHistory(),
    routes
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