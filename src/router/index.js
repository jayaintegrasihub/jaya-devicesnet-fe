import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.VUE_APP_BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      meta: { requiresAuth: false },
      component: () => import('../views/auth/LoginView.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      meta: { requiresAuth: true },
      component: () => import('../views/dashboard/Dashboard.vue')
    },
    {
      path: '/devices',
      name: 'devicesManagement',
      meta: {
        requiresAuth: true,
        roles: ['admin']
      },
      component: () => import('../views/devices/DevicesManagement.vue')
    },
    {
      path: '/master-data',
      name: 'masterData',
      meta: {
        requiresAuth: true,
        roles: ['admin']
      },
      component: () => import('../views/master-data/MasterData.vue')
    },
    {
      path: '/reports',
      name: 'report',
      meta: { requiresAuth: true },
      component: () => import('../views/report/Report.vue')
    },

    {
      path: '/device-detail/:id',
      name: 'deviceDetail',
      meta: { requiresAuth: true },
      props: true,
      component: () => import('../views/DeviceDetail.vue')
    },
    {
      path: '/gateway-detail/:id',
      name: 'gatewayDetail',
      meta: { requiresAuth: true },
      props: true,
      component: () => import('../views/GatewayDetail.vue')
    },
    {
      path: '/offline-nodes',
      name: 'offileNodes',
      meta: { requiresAuth: true },
      props: true,
      component: () => import('../views/dashboard/offline-nodes/OfflineNodes.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = 'Telemetric | DevicesNet'

  const token = localStorage.getItem('auth.accessToken')
  const role = localStorage.getItem('auth.role')

  if (to.meta.requiresAuth && !token) {
    return next({ name: 'login' })
  }

  if (to.meta.roles && !to.meta.roles.includes(role)) {
    return next({ name: 'dashboard' })
  }

  if (!to.meta.requiresAuth && token) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
