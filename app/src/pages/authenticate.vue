<template>
  <main>
    <h1>Authenticate</h1>
    <div v-if="isLoggingIn">
      Logging in...
    </div>
    <div v-if="isRedirecting">
      Redirecting you to {{ next }}
    </div>
    <error-element header="Unable to Login" :error="error" />
  </main>
</template>

<script>
import ErrorElement from '../components/error.vue';

import isJWT from '../utils/is-jwt';
import isRedirect from '../utils/is-redirect';
import userService from '../services/user';
import GraphQLError from '../graphql/error';

export default {
  name: 'AuthenticatePage',

  components: {
    ErrorElement,
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
    isLoggingIn: false,
    isRedirecting: false,
  }),

  created() {
    this.login();
  },

  methods: {
    async login() {
      try {
        this.error = null;
        this.isLoggingIn = true;
        const { token, next } = this;
        if (!token) throw new Error('No token was provided.');
        if (!isJWT(token)) throw new Error('The provided token format is invalid.');
        await userService.loginUserFromLink({ loginLinkToken: token });

        const redirect = isRedirect(next);
        if (redirect.valid) {
          this.isRedirecting = true;
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
        this.isLoggingIn = false;
      }
    },
  },
};
</script>
