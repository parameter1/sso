import { createRouter, createWebHistory } from 'vue-router';
import userService from '../services/user';
import constants from '../constants';

const routes = [
  {
    path: '/',
    redirect: '/manage',
  },
  {
    path: '/authenticate',
    name: 'authenticate',
    component: () => import('../pages/authenticate.vue'),
    props: ({ query }) => ({
      token: query.token,
      next: query.next,
    }),
  },
  {
    path: '/manage',
    name: 'manage',
    meta: { whenAuthed: { then: true, otherwise: 'login' } },
    component: () => import('../pages/manage.vue'),
  },
  {
    path: '/login',
    name: 'login',
    meta: { whenAuthed: { then: 'manage', otherwise: true } },
    component: () => import('../pages/login.vue'),
    props: ({ query }) => ({
      next: query.next,
    }),
  },
  {
    path: '/logout',
    name: 'logout',
    meta: { whenAuthed: { then: true, otherwise: 'login' } },
    component: () => import('../pages/logout.vue'),
    props: ({ query }) => ({
      next: query.next,
    }),
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
  history: createWebHistory(constants.BASE),
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
