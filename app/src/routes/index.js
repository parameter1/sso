import { nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import userService from '../services/user';

const DEFAULT_TITLE = 'Parameter1 SSO';

const routes = [
  {
    path: '/',
    redirect: '/manage',
  },
  {
    path: '/authenticate',
    name: 'authenticate',
    component: () => import('../pages/authenticate.vue'),
    meta: { title: 'Authenticate' },
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
    children: [
      {
        path: '',
        name: 'manage.index',
        component: () => import('../pages/manage/index.vue'),
      },
      {
        path: 'profile',
        name: 'manage.profile',
        component: () => import('../pages/manage/profile.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    meta: { whenAuthed: { then: 'manage', otherwise: true }, title: 'Sign In' },
    component: () => import('../pages/login.vue'),
    props: ({ query }) => ({
      appKey: query.appKey,
      next: query.next,
    }),
  },
  {
    path: '/error',
    name: 'error',
    meta: { title: 'Fatal Error' },
    component: () => import('../pages/error.vue'),
    props: true,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    meta: { title: 'Page Not Found' },
    component: () => import('../pages/not-found.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
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

router.afterEach((to) => {
  const { title } = to.meta;
  nextTick(() => {
    document.title = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
  });
});

export default router;
