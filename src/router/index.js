import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'KeyboardSelect',
    component: () => import(/* webpackChunkName: "about" */ '../views/KeyboardSelect.vue')
  },
  {
    path: '/video-setup',
    name: 'VideoSetup',
    component: () => import(/* webpackChunkName: "about" */ '../views/VideoSetup.vue')
  },
  {
    path: '/streaming',
    name: 'VideoStreamer',
    component: () => import(/* webpackChunkName: "about" */ '../views/VideoStreamer.vue')
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
