<template>
  <div class="min-h-full" v-if="!loading">
    <app-header :current-user="currentUser" :primary-nav-items="primaryNavItems" />

    <!-- main content -->
    <main class="mx-auto max-w-7xl pb-10 lg:py-12 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script>
import gql from 'graphql-tag';
import { HomeIcon, BuildingOffice2Icon } from '@heroicons/vue/24/outline';

import AppHeader from '../components/app/header.vue';

import userService from '../services/user';
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
    primaryNavItems: [{
      name: 'Dashboard',
      to: '/manage',
      icon: HomeIcon,
    }, {
      name: 'Organizations',
      to: '/manage/organizations',
      icon: BuildingOffice2Icon,
    }],
  }),

  methods: {
    async logout() {
      await userService.logout({ next: this.next });
    },
  },
};
</script>
