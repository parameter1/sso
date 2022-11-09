<template>
  <h1>Manage</h1>
</template>

<script>
import userService from '../services/user';
import { CURRENT_USER } from '../graphql/queries';
import GraphQLError from '../graphql/error';

export default {
  name: 'ManagePage',

  apollo: {
    currentUser: {
      query: CURRENT_USER,
      fetchPolicy: 'cache-and-network',
      error(e) { this.error = new GraphQLError(e); },
      watchLoading(isLoading) {
        this.isLoading = isLoading;
        if (isLoading) this.error = null;
      },
    },
  },

  data: () => ({

  }),

  methods: {
    async logout() {
      await userService.logout({ next: this.next });
    },
  },
};
</script>
