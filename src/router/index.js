import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import CustomerBoardPage from '../pages/customers/CustomerBoardPage.vue'
import CustomerCreatePage from '../pages/customers/CustomerCreatePage.vue'
import CustomerDetailPage from '../pages/customers/CustomerDetailPage.vue'
import UserManagementPage from '../pages/users/UserManagementPage.vue'
import UsersPage from '../pages/users/UsersPage.vue'
import ProfilePage from '../pages/profile/ProfilePage.vue'
import CustomerDealsPage from '../pages/customers/CustomerDealsPage.vue'
import CustomerLossesPage from '../pages/customers/CustomerLossesPage.vue'
import DashboardPage from '../pages/Dashboard/DashboardPage.vue'
import RevenueAnalyticsPage from '../pages/reports/RevenueAnalyticsPage.vue'
import RevenueReportPage from '../pages/reports/RevenueReportPage.vue'
import CustomerReportPage from '../pages/reports/CustomerReportPage.vue'


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { guest: true },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/customers',
      name: 'customers.index',
      component: CustomerBoardPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/customers/create',
      name: 'customers.create',
      component: CustomerCreatePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/customers/:id',
      name: 'customers.detail',
      component: CustomerDetailPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/users',
      name: 'users.index',
      component: UsersPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile.index',
      component: ProfilePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/customer-deals',
      name: 'customers.deals',
      component: CustomerDealsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/customer-losses',
      name: 'customers.losses',
      component: CustomerLossesPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/analytics/revenue',
      name: 'analytics.revenue',
      component: RevenueAnalyticsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/reports/revenue',
      name: 'reports.revenue',
      component: RevenueReportPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/reports/customers',
      name: 'reports.customers',
      component: CustomerReportPage,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    return next('/login')
  }

  if (to.meta.guest && token) {
    return next('/dashboard')
  }

  next()
})

export default router