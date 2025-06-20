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
      meta: { requiresAuth: true },
      component: () => import('../views/devices/DevicesManagement.vue')
    },
    {
      path: '/reports',
      name: 'report',
      meta: { requiresAuth: true },
      component: () => import('../views/report/Report.vue')
    },
    {
      path: '/master-data',
      name: 'masterData',
      meta: { requiresAuth: true },
      component: () => import('../views/master-data/MasterData.vue')
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

router.beforeEach(async (to, from, next) => {
  document.title = 'Telemetric | DevicesNet'
  if (to.meta.requiresAuth && !localStorage.getItem('auth.accessToken')) {
    next({ name: 'login' })
  } else if (
    (to.meta.requiresAuth && localStorage.getItem('auth.accessToken')) ||
    to.meta.freeAccess
  ) {
    next()
  } else if (!to.meta.requiresAuth && localStorage.getItem('auth.accessToken')) {
    next({ name: 'devicesManagement' })
  } else next()
})

export default router
