import { createRouter, createWebHistory } from 'vue-router';
import userService from '../services/user';

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
  {
    path: '/error',
    name: 'error',
    component: () => import('../pages/error.vue'),
    props: true,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../pages/not-found.vue'),
  },
];

const router = createRouter({
  history: createWebHistory('/app/'),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const matched = to.matched.find((record) => record.meta.whenAuthed);
  if (matched) {
    try {
      const isLoggedIn = await userService.isLoggedIn();
      const { then, otherwise } = matched.meta.whenAuthed;

      if (isLoggedIn) {
        if (then === true) return next();
        return next({ name: then });
      }
      if (otherwise === true) return next();
      return next({ name: otherwise });
    } catch (e) {
      next({ name: 'error', params: { error: e } });
    }
  } else {
    next();
  }
  return null;
});

export default router;
