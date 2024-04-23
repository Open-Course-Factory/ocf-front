import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Details from '../components/Details.vue'

const routes = [
    { path: '/login', name: 'Login', component: Login, props: true },
    { path: '/details/:userId/:secretToken', name: 'Details', component: Details, props: true }
]
const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router 