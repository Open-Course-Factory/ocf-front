/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2025 Solution Libre
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
import TerminalCreation from '../components/Pages/TerminalCreation.vue';
import TerminalMySessions from '../components/Pages/TerminalMySessions.vue';
import TerminalSharedWithMe from '../components/Pages/TerminalSharedWithMe.vue';
import UserTerminalKeys from '../components/Pages/UserTerminalKeys.vue';

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
  // Public help route for non-authenticated users
  {
    path: '/help-public',
    name: 'HelpPublic',
    component: () => import('../components/Pages/Help.vue'),
    meta: { requiresAuth: false }
  },
  // Public help sub-routes for non-authenticated users
  {
    path: '/help-public/terminals/getting-started',
    name: 'HelpPublicTerminalsGettingStarted',
    component: () => import('../components/Pages/Help/TerminalGettingStarted.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/help-public/terminals/managing-sessions',
    name: 'HelpPublicTerminalsManagingSessions',
    component: () => import('../components/Pages/Help/TerminalManagingSessions.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/help-public/terminals/sharing',
    name: 'HelpPublicTerminalsSharing',
    component: () => import('../components/Pages/Help/TerminalSharing.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/help-public/terminals/troubleshooting',
    name: 'HelpPublicTerminalsTroubleshooting',
    component: () => import('../components/Pages/Help/TerminalTroubleshooting.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/help-public/courses/structure',
    name: 'HelpPublicCoursesStructure',
    component: () => import('../components/Pages/Help/CourseStructure.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/help-public/courses/content',
    name: 'HelpPublicCoursesContent',
    component: () => import('../components/Pages/Help/CourseContent.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/help-public/account/subscription',
    name: 'HelpPublicAccountSubscription',
    component: () => import('../components/Pages/Help/AccountSubscription.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/help-public/account/billing',
    name: 'HelpPublicAccountBilling',
    component: () => import('../components/Pages/Help/AccountBilling.vue'),
    meta: { requiresAuth: false }
  },
  // Route spéciale pour l'affichage du terminal en iframe (sans layout)
  {
    path: '/terminal/:sessionId',
    name: 'TerminalViewer',
    component: () => import('../components/Pages/TerminalPage.vue'),
    meta: { 
      requiresAuth: true,
      isIframe: true // Marquer cette route comme étant pour iframe
    }
  },
  // Route alternative avec query parameters
  {
    path: '/terminal-view',
    name: 'TerminalViewerQuery',
    component: () => import('../components/Pages/TerminalPage.vue'),
    meta: { 
      requiresAuth: true,
      isIframe: true
    }
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
      { path: 'terminal-creation', name: 'TerminalCreation', component: TerminalCreation, meta: { requiresAuth: true } },
      { path: 'terminal-sessions', name: 'TerminalSessions', component: TerminalMySessions, meta: { requiresAuth: true } },
      { path: 'terminal-shared', name: 'TerminalSharedWithMe', component: TerminalSharedWithMe, meta: { requiresAuth: true } },
      { path: 'user-terminal-keys', name: 'UserTerminalKeys', component: UserTerminalKeys, meta: { requiresAuth: true } },
      { path: 'course/:id', component: CourseDetails, meta: { requiresAuth: true } },
      {
        path: 'user',
        meta: { requiresAuth: true },
        children: [{ path: '', component: User }],
      },
      { path: 'subscription-plans', name: 'SubscriptionPlans', component: () => import('../components/Pages/SubscriptionPlansCustomer.vue'), meta: { requiresAuth: true } },
      { path: 'admin/subscription-plans', name: 'AdminSubscriptionPlans', component: () => import('../components/Pages/SubscriptionPlans.vue'), meta: { requiresAuth: true } },
      { path: 'billing-addresses', name: 'BillingAddresses', component: () => import('../components/Pages/BillingAddresses.vue'), meta: { requiresAuth: true } },
      { path: 'payment-methods', name: 'PaymentMethods', component: () => import('../components/Pages/PaymentMethods.vue'), meta: { requiresAuth: true } },
      { path: 'invoices', name: 'Invoices', component: () => import('../components/Pages/Invoices.vue'), meta: { requiresAuth: true } },
      { path: 'subscription-dashboard', name: 'SubscriptionDashboard', component: () => import('../components/Pages/SubscriptionDashboard.vue'), meta: { requiresAuth: true } },
      // Route pour le checkout avec planId
      { 
        path: 'checkout/:planId', 
        name: 'Checkout', 
        component: () => import('../components/Flows/CheckoutFlow.vue'), 
        meta: { requiresAuth: true },
        props: true
      },

      // Route pour le checkout sans planId (sélection depuis la page des plans)
      { 
        path: 'checkout', 
        name: 'CheckoutSelect', 
        component: () => import('../components/Flows/CheckoutFlow.vue'), 
        meta: { requiresAuth: true }
      },

      // Route pour le succès de paiement (retour depuis Stripe)
      { 
        path: 'checkout-success', 
        name: 'CheckoutSuccess', 
        component: () => import('../components/Flows/CheckoutSuccess.vue'), 
        meta: { requiresAuth: true }
      },

      // Route pour l'annulation de paiement (retour depuis Stripe)
      {
        path: 'checkout-canceled',
        name: 'CheckoutCanceled',
        component: () => import('../components/Flows/CheckoutCanceled.vue'),
        meta: { requiresAuth: true }
      },

      // Demo routes (for testing subscription flow)
      {
        path: 'demo-checkout',
        name: 'DemoCheckout',
        component: () => import('../components/Demo/DemoCheckout.vue')
      },
      {
        path: 'demo-portal',
        name: 'DemoPortal',
        component: () => import('../components/Demo/DemoPortal.vue')
      },

      // Debug routes (admin only)
      {
        path: 'debug/feature-flags',
        name: 'FeatureFlagsDebug',
        component: () => import('../components/Debug/FeatureFlagsDebug.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
      },

      // Help and Documentation routes
      {
        path: 'help',
        name: 'Help',
        component: () => import('../components/Pages/Help.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'help/terminals/getting-started',
        name: 'HelpTerminalsGettingStarted',
        component: () => import('../components/Pages/Help/TerminalGettingStarted.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'help/terminals/managing-sessions',
        name: 'HelpTerminalsManagingSessions',
        component: () => import('../components/Pages/Help/TerminalManagingSessions.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'help/terminals/sharing',
        name: 'HelpTerminalsSharing',
        component: () => import('../components/Pages/Help/TerminalSharing.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'help/terminals/troubleshooting',
        name: 'HelpTerminalsTroubleshooting',
        component: () => import('../components/Pages/Help/TerminalTroubleshooting.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'help/courses/structure',
        name: 'HelpCoursesStructure',
        component: () => import('../components/Pages/Help/CourseStructure.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'help/courses/content',
        name: 'HelpCoursesContent',
        component: () => import('../components/Pages/Help/CourseContent.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'help/account/subscription',
        name: 'HelpAccountSubscription',
        component: () => import('../components/Pages/Help/AccountSubscription.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'help/account/billing',
        name: 'HelpAccountBilling',
        component: () => import('../components/Pages/Help/AccountBilling.vue'),
        meta: { requiresAuth: true }
      }
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
