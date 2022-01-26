import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'index',
    component: () => import('../pages/index.vue'),
  },
  {
    path: '/_style',
    name: 'style-guide',
    component: () => import('../pages/style-guide.vue'),
  },
];

const router = createRouter({
  history: createWebHistory('/app/'),
  routes,
});

export default router;
