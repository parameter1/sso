<template>
  <div>
    <p v-if="isLoading">
      Loading...
    </p>
    <p v-if="!isLoading && ping">
      <hello-world :name="ping" />
    </p>
    <p v-if="error">
      {{ error.message }}
    </p>
  </div>
</template>

<script>
import HelloWorld from '../components/hello-world.vue';
import { PING } from '../graphql/queries';
import GraphQLError from '../graphql/error';

export default {
  name: 'IndexPage',

  components: { HelloWorld },

  apollo: {
    ping: {
      query: PING,
      fetchPolicy: 'cache-and-network',
      error(e) { this.error = new GraphQLError(e); },
      watchLoading(isLoading) {
        this.isLoading = isLoading;
        if (isLoading) this.error = null;
      },
    },
  },

  data: () => ({
    error: null,
    isLoading: false,
    ping: null,
  }),
};
</script>
