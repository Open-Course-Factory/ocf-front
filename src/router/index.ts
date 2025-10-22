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
import { featureFlagService } from '../services/features';
import { useSettingsNavigation } from '../composables/useSettingsNavigation';
import Layout from '../components/Layout.vue';
import Courses from '../components/Pages/Courses.vue';
import Chapters from '../components/Pages/Chapters.vue';
import Sections from '../components/Pages/Sections.vue';
import Pages from '../components/Pages/Pages.vue';
import Schedules from '../components/Pages/Schedules.vue';
import CourseDetails from '../components/Pages/CourseDetails.vue';
import ChapterDetails from '../components/Pages/ChapterDetails.vue';
import SectionDetails from '../components/Pages/SectionDetails.vue';
import CourseEditor from '../components/Pages/CourseEditor.vue';
import LandingPage from '../components/Pages/LandingPage.vue';
import User from '../components/Pages/User.vue';
import Generations from '../components/Pages/Generations.vue';
import Themes from '../components/Pages/Themes.vue';
import TerminalCreation from '../components/Pages/TerminalCreation.vue';
import TerminalMySessions from '../components/Pages/TerminalMySessions.vue';
import UserTerminalKeys from '../components/Pages/UserTerminalKeys.vue';
import ClassGroups from '../components/Pages/ClassGroups.vue';
import GroupMembers from '../components/Pages/GroupMembers.vue';
import GroupDetail from '../components/Pages/GroupDetail.vue';

const basicRoutes = [
  { path: '/', name: 'LandingPage', component: LandingPage, meta: { requiresAuth: false } },
  { path: '/login', name: 'Login', component: () => import('../components/Pages/Login.vue'), meta: { requiresAuth: false } },
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
  // Legal notices (public, no auth required)
  {
    path: '/legal',
    name: 'Legal',
    component: () => import('../components/Pages/Legal.vue'),
    meta: { requiresAuth: false }
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
      { path: 'courses', name: 'Courses', component: Courses, meta: { requiresAuth: true, requiresFeature: 'course_conception' } },
      { path: 'course-editor', name: 'CourseEditor', component: CourseEditor, meta: { requiresAuth: true, requiresFeature: 'course_conception', collapseNav: true } },
      { path: 'chapters', name: 'Chapters', component: Chapters, meta: { requiresAuth: true, requiresFeature: 'course_conception' } },
      { path: 'sections', name: 'Sections', component: Sections, meta: { requiresAuth: true, requiresFeature: 'course_conception' } },
      { path: 'pages', name: 'Pages', component: Pages, meta: { requiresAuth: true, requiresFeature: 'course_conception' } },
      { path: 'schedules', name: 'Schedules', component: Schedules, meta: { requiresAuth: true } },
      { path: 'themes', name: 'Themes', component: Themes, meta: { requiresAuth: true } },
      { path: 'generations', name: 'Generations', component: Generations, meta: { requiresAuth: true } },
      { path: 'terminal-creation', name: 'TerminalCreation', component: TerminalCreation, meta: { requiresAuth: true, requiresFeature: 'terminal_management' } },
      { path: 'terminal-sessions', name: 'TerminalSessions', component: TerminalMySessions, meta: { requiresAuth: true } },
      { path: 'terminal-shared', redirect: '/terminal-sessions' }, // Redirect old route to unified sessions page
      { path: 'user-terminal-keys', name: 'UserTerminalKeys', component: UserTerminalKeys, meta: { requiresAuth: true, isSettings: true } },
      { path: 'class-groups', name: 'ClassGroups', component: ClassGroups, meta: { requiresAuth: true, requiresFeature: 'class_groups' } },
      { path: 'class-groups/:id', name: 'GroupDetail', component: GroupDetail, meta: { requiresAuth: true, requiresFeature: 'class_groups' } },
      { path: 'group-members', name: 'GroupMembers', component: GroupMembers, meta: { requiresAuth: true, requiresFeature: 'class_groups' } },
      { path: 'course/:id', name: 'CourseDetails', component: CourseDetails, meta: { requiresAuth: true, requiresFeature: 'course_conception' } },
      { path: 'chapter/:id', name: 'ChapterDetails', component: ChapterDetails, meta: { requiresAuth: true, requiresFeature: 'course_conception' } },
      { path: 'section/:id', name: 'SectionDetails', component: SectionDetails, meta: { requiresAuth: true, requiresFeature: 'course_conception' } },
      {
        path: 'user',
        meta: { requiresAuth: true },
        children: [{ path: '', component: User }],
      },
      // User Settings Routes
      {
        path: 'settings/navigation',
        name: 'SettingsNavigation',
        component: () => import('../components/UI/SettingsPageWrapper.vue'),
        props: { componentName: 'NavigationSettings' },
        meta: { requiresAuth: true, isSettings: true }
      },
      {
        path: 'settings/localization',
        name: 'SettingsLocalization',
        component: () => import('../components/UI/SettingsPageWrapper.vue'),
        props: { componentName: 'LocalizationSettings' },
        meta: { requiresAuth: true, isSettings: true }
      },
      {
        path: 'settings/ui',
        name: 'SettingsUI',
        component: () => import('../components/UI/SettingsPageWrapper.vue'),
        props: { componentName: 'UISettings' },
        meta: { requiresAuth: true, isSettings: true }
      },
      {
        path: 'settings/notifications',
        name: 'SettingsNotifications',
        component: () => import('../components/UI/SettingsPageWrapper.vue'),
        props: { componentName: 'NotificationSettings' },
        meta: { requiresAuth: true, isSettings: true }
      },
      {
        path: 'settings/security',
        name: 'SettingsSecurity',
        component: () => import('../components/UI/SettingsPageWrapper.vue'),
        props: { componentName: 'SecuritySettings' },
        meta: { requiresAuth: true, isSettings: true }
      },
      {
        path: 'settings/ssh-keys',
        name: 'SettingsSSHKeys',
        component: () => import('../components/UI/SettingsPageWrapper.vue'),
        props: { componentName: 'SSHKeysSettings' },
        meta: { requiresAuth: true, isSettings: true }
      },
      { path: 'subscription-plans', name: 'SubscriptionPlans', component: () => import('../components/Pages/SubscriptionPlansCustomer.vue'), meta: { requiresAuth: true } },
      { path: 'admin/subscription-plans', name: 'AdminSubscriptionPlans', component: () => import('../components/Pages/SubscriptionPlans.vue'), meta: { requiresAuth: true } },
      { path: 'billing-addresses', name: 'BillingAddresses', component: () => import('../components/Pages/BillingAddresses.vue'), meta: { requiresAuth: true, isSettings: true } },
      { path: 'payment-methods', name: 'PaymentMethods', component: () => import('../components/Pages/PaymentMethods.vue'), meta: { requiresAuth: true, isSettings: true } },
      { path: 'invoices', name: 'Invoices', component: () => import('../components/Pages/Invoices.vue'), meta: { requiresAuth: true } },
      { path: 'subscription-dashboard', name: 'SubscriptionDashboard', component: () => import('../components/Pages/SubscriptionDashboard.vue'), meta: { requiresAuth: true } },

      // Bulk License Management Routes
      {
        path: 'bulk-license-purchase',
        name: 'BulkLicensePurchase',
        component: () => import('../components/Pages/BulkLicensePurchase.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'license-management',
        name: 'LicenseManagement',
        component: () => import('../components/Pages/LicenseManagementDashboard.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'license-management/:id',
        name: 'BatchDetails',
        component: () => import('../components/Pages/BatchDetails.vue'),
        meta: { requiresAuth: true }
      },

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

      // Admin routes
      {
        path: 'admin/terminal-metrics',
        name: 'AdminTerminalMetrics',
        component: () => import('../components/Pages/Admin/TerminalMetrics.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'admin/invoice-cleanup',
        name: 'AdminInvoiceCleanup',
        component: () => import('../components/Pages/Admin/InvoiceCleanup.vue'),
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

// Cache for route feature flag checks (per-user session)
const routeFeatureCache = new Map<string, boolean>();

router.beforeEach(async (to, from, next) => {
  const currentUserStore = useCurrentUserStore();
  const { storePreviousRoute } = useSettingsNavigation();

  // Store previous route when entering settings
  if (to.meta.isSettings && !from.meta.isSettings) {
    storePreviousRoute(from);
  }

  // Redirect authenticated users away from login/register pages
  if (to.name === 'Login' || to.name === 'Register') {
    console.log('🔐 Navigation to', to.name, '- isAuthenticated:', currentUserStore.isAuthenticated);
    if (currentUserStore.isAuthenticated) {
      console.log('🔐 Blocking access, redirecting to /terminal-sessions');
      next({ path: '/terminal-sessions' });
      return;
    }
  }

  // Allow access if requiresAuth is explicitly false (public routes)
  if (to.meta.requiresAuth === false) {
    next();
    return;
  }

  // Check authentication for protected routes
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!currentUserStore.isAuthenticated) {
      next({ name: 'Login' });
      return;
    }
  }

  // Wait for feature flags to initialize before checking (cached after first call)
  await featureFlagService.waitForInitialization();

  // Check feature flags (deep link protection) with per-route caching
  const requiredFeature = to.meta.requiresFeature as string | undefined;
  if (requiredFeature) {
    const actor = currentUserStore.userId ? {
      userId: currentUserStore.userId,
      role: currentUserStore.userRoles[0]
    } : undefined;

    // Create cache key combining route and user
    const cacheKey = `${to.path}:${requiredFeature}:${currentUserStore.userId}`;

    // Check cache first
    let isFeatureEnabled: boolean;
    if (routeFeatureCache.has(cacheKey)) {
      isFeatureEnabled = routeFeatureCache.get(cacheKey)!;
      console.debug(`🏴 Using cached feature check for ${requiredFeature}: ${isFeatureEnabled}`);
    } else {
      // Check feature flag and cache result
      isFeatureEnabled = featureFlagService.isEnabled(requiredFeature, actor);
      routeFeatureCache.set(cacheKey, isFeatureEnabled);
    }

    if (!isFeatureEnabled) {
      console.warn(`🏴 Access denied: Feature "${requiredFeature}" is disabled`);
      // Redirect to home with error message
      next({
        name: 'LandingPage',
        query: { error: 'feature_disabled', feature: requiredFeature }
      });
      return;
    }
  }

  next();
});

export default router;
