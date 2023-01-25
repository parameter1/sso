<template>
  <div />
</template>

<script>
import gql from 'graphql-tag';

import { TOKEN_KEY } from '../constants';
import isRedirect from '../utils/is-redirect';
import { AuthTokenStorage } from '../services/token-storage';

const QUERY = gql`
  query CheckAuth {
    currentUser { _id }
  }
`;

export default {
  name: 'CheckAuthPage',

  props: {
    next: {
      type: String,
      default: null,
    },
  },

  async mounted() {
    const { next } = this;

    // when not authenticated (no token), redirect to login page.
    if (!AuthTokenStorage.exists()) return this.goToLoginPage({ next });
    // when token is expired, redirect to login page.
    const isAuthValid = await this.checkAuth();
    if (!isAuthValid) return this.goToLoginPage({ next });

    // at this point, there is a verified user.
    const redirect = isRedirect(next);
    // when the redirect is invalid, go to the root manage page.
    if (!redirect.valid) return this.$router.replace('/manage');
    // when the redirect is internal, navigate
    if (redirect.type !== 'external') return this.$router.replace(next);

    // otherwise, redirect the user back to the originating app with the auth token appended
    const token = AuthTokenStorage.get();
    const url = new URL(next);
    url.searchParams.set(TOKEN_KEY, token);
    window.location.href = `${url}`;
    return true;
  },

  methods: {
    async checkAuth() {
      try {
        await this.$apollo.query({ query: QUERY });
        return true;
      } catch (e) {
        return false;
      }
    },

    goToLoginPage({ next } = {}) {
      this.$router.replace({ path: '/login', query: { next } });
    },
  },
};
</script>
