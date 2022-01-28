<template>
  <main>
    <h1>Logout</h1>
    <div v-if="isLoggingIn">
      Logging out...
    </div>
  </main>
</template>

<script>
import userService from '../services/user';
import GraphQLError from '../graphql/error';

export default {
  name: 'LogoutPage',

  props: {
    next: {
      type: String,
      default: null,
    },
  },

  data: () => ({
    isLoggingOut: false,
  }),

  created() {
    this.logout();
  },

  methods: {
    async logout() {
      try {
        this.error = null;
        this.isLoggingOut = true;
        await userService.logout({ next: this.next });
      } catch (e) {
        this.error = new GraphQLError(e);
      } finally {
        this.isLoggingOut = false;
      }
    },
  },
};
</script>
