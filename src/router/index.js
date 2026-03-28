import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import CustomerBoardPage from '../pages/customers/CustomerBoardPage.vue'
import CustomerCreatePage from '../pages/customers/CustomerCreatePage.vue'
import CustomerDetailPage from '../pages/customers/CustomerDetailPage.vue'
import UserManagementPage from '../pages/users/UserManagementPage.vue'

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
      component: UserManagementPage,
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