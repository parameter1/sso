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
        if (!/^[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$/.test(token)) {
          throw new Error('The provided token is invalid.');
        }
        await userService.loginUserFromLink({ loginLinkToken: token });
        if (next) {
          this.isRedirecting = true;
          if (/^http[s?]:/i.test(next)) {
            window.location.href = next;
          } else {
            this.$$router.replace(next);
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
