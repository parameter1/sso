<template>
  <splash-image-layout>
    <template #header>
      <div class="flex items-center gap-2">
        <loading-spinner color="slate-800" />
        Logging out...
      </div>
    </template>
  </splash-image-layout>
</template>
<script>
import LoadingSpinner from '../components/loading-spinner.vue';
import SplashImageLayout from '../components/layouts/splash-image/horizontal-with-logo.vue';

import userService from '../services/user';

export default {
  name: 'LogoutPage',

  components: {
    LoadingSpinner,
    SplashImageLayout,
  },

  props: {
    next: {
      type: String,
      default: null,
    },
  },

  async mounted() {
    await userService.logout({ next: this.next });
  },
};
</script>
