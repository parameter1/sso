<template>
  <router-view />
</template>

<script>
import userService from '../services/user';

export default {
  name: 'CorePage',

  created() {
    const { query } = this.$route;
    userService.attachStorageListener({ redirectTo: query.next });
    this.$router.replace({ path: '/login', query });
  },
};
</script>
