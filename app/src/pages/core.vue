<template>
  <router-view />
</template>

<script>
import userService from '../services/user';

export default {
  name: 'CorePage',

  created() {
    userService.attachStorageListener();
    this.$router.replace('/login');
  },
};
</script>
