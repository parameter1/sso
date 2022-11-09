<template>
  <div class="min-h-full" v-if="!loading">
    <app-header :user="currentUser" />

    <!-- main content -->
    <main class="mx-auto max-w-7xl pb-10 py-4 sm:py-6 px-4 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script>
import gql from 'graphql-tag';

import AppHeader from '../components/app/header.vue';

import GraphQLError from '../graphql/error';

const QUERY = gql`
  query ManagePage {
    currentUser {
      _id
      email { address }
      image { src srcset }
      name { full initials }
    }
  }
`;

export default {
  name: 'ManagePage',

  components: {
    AppHeader,
  },

  apollo: {
    currentUser: {
      query: QUERY,
      fetchPolicy: 'cache-and-network',
      error(e) { this.error = new GraphQLError(e); },
      watchLoading(isLoading) {
        this.loading = isLoading;
        if (isLoading) this.error = null;
      },
    },
  },

  data: () => ({
    currentUser: {
      email: {},
      image: {},
      name: {},
    },
    error: null,
    loading: false,
  }),
};
</script>
