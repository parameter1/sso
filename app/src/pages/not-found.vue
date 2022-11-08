<template>
  <splash-image-layout>
    <template #header>
      Page not found
    </template>
    <template #default>
      <p class="mt-2 text-base text-slate-500">
        Sorry, we couldn’t find the page you’re looking for.
      </p>

      <div class="mt-6">
        <router-link
          to="/"
          class="text-base font-medium text-blue-600 hover:text-blue-500"
        >
          Go back home
          <span aria-hidden="true"> &rarr;</span>
        </router-link>
      </div>
    </template>
  </splash-image-layout>
</template>

<script>
import SplashImageLayout from '../components/layouts/splash-image/horizontal-with-logo.vue';

export default {
  name: 'NotFoundPage',

  components: {
    SplashImageLayout,
  },
};
</script>
