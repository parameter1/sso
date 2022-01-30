<template>
  <main>
    <h1>Manage</h1>
    <p v-if="isLoading">
      Loading...
    </p>
    <error-element v-else-if="error" :error="error" />
    <nav v-else>
      <ul>
        <li v-for="item in primaryNavItems" :key="item.to">
          <router-link :to="item.to">
            {{ item.name }}
          </router-link>
        </li>
      </ul>
    </nav>

    <router-view />
  </main>
</template>

<script>
import ErrorElement from '../components/error.vue';

import { CURRENT_USER } from '../graphql/queries';
import GraphQLError from '../graphql/error';

export default {
  name: 'ManagePage',

  components: {
    ErrorElement,
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
    currentUser: null,
    error: null,
    isLoading: false,
    primaryNavItems: [
      { name: 'Index', to: '/manage' },
      { name: 'Profile', to: '/manage/profile' },
      { name: 'Logout', to: '/logout' },
    ],
  }),
};
</script>
