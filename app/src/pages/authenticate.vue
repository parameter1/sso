<template>
  <splash-image-layout>
    <template #header>
      <div v-if="authenticating || redirecting" class="flex items-center gap-2">
        <loading-spinner color="slate-800" />
        <span v-if="authenticating">
          Logging in...
        </span>
        <span v-else-if="redirecting">
          Redirecting...
        </span>
      </div>
      <div v-else-if="error" class="flex items-center gap-2">
        <div
          class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center
          rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
        >
          <shield-exclamation-icon class="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        Unable to login
      </div>
    </template>
    <template #default>
      <div class="text-slate-500">
        <div v-if="error">
          <p>{{ error.message }}</p>
          <div class="mt-6">
            <router-link
              to="/login"
              class="text-base font-medium text-blue-600 hover:text-blue-500"
            >
              Resend login link
              <span aria-hidden="true"> &rarr;</span>
            </router-link>
          </div>
        </div>
        <span v-else-if="redirecting && next">
          Redirecting you to {{ next }}
        </span>
      </div>
    </template>
  </splash-image-layout>
</template>

<script>
import { ShieldExclamationIcon } from '@heroicons/vue/24/outline';
import LoadingSpinner from '../components/loading-spinner.vue';
import SplashImageLayout from '../components/layouts/splash-image/horizontal-with-logo.vue';

import isJWT from '../utils/is-jwt';
import isRedirect from '../utils/is-redirect';
import userService from '../services/user';
import GraphQLError from '../graphql/error';

export default {
  name: 'AuthenticatePage',

  components: {
    LoadingSpinner,
    ShieldExclamationIcon,
    SplashImageLayout,
  },

  props: {
    token: {
      type: String,
      required: true,
    },
    next: {
      type: String,
      default: null,
    },
  },

  data: () => ({
    error: null,
    authenticating: false,
    redirecting: false,
  }),

  created() {
    this.login();
  },

  methods: {
    async login() {
      try {
        this.error = null;
        this.authenticating = true;
        const { token, next } = this;
        if (!token) throw new Error('No token was provided.');
        if (!isJWT(token)) throw new Error('The provided token format is invalid.');
        await userService.loginUserFromLink({ loginLinkToken: token });

        const redirect = isRedirect(next);
        if (redirect.valid) {
          this.redirecting = true;
          if (redirect.type === 'external') {
            window.location.href = next;
          } else {
            const resolved = this.$router.resolve(next);
            const to = !resolved || resolved.name === 'not-found' ? '/manage' : next;
            this.$router.replace(to);
          }
        } else {
          this.$router.replace('/manage');
        }
      } catch (e) {
        this.error = new GraphQLError(e);
      } finally {
        this.authenticating = false;
      }
    },
  },
};
</script>
