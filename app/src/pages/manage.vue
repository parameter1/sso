<template>
  <div class="min-h-full">
    <app-header
      :current-user="user"
      :primary-nav-items="navigation"
    />

    <!-- main content -->
    <main class="mx-auto max-w-7xl pb-10 lg:py-12 lg:px-8">
      Hi
    </main>
  </div>
</template>

<script>
import AppHeader from '../components/app/header.vue';

import userService from '../services/user';
import { CURRENT_USER } from '../graphql/queries';
import GraphQLError from '../graphql/error';

export default {
  name: 'ManagePage',

  components: {
    AppHeader,
  },

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
    navigation: [{
      name: 'Dashboard',
      to: '#',
      current: true,
    }, {
      name: 'Organizations',
      to: '#',
    }],

    user: {
      name: 'Lisa Marie',
      email: 'lisamarie@example.com',
      imageUrl: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=80',
    },
  }),

  methods: {
    async logout() {
      await userService.logout({ next: this.next });
    },
  },
};
</script>
