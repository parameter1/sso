<template>
  <splash-image-layout>
    <div class="mx-auto w-full max-w-sm lg:w-96">
      <div class="mb-8">
        <img
          class="h-12 w-auto"
          src="https://img.parameter1.com/www/p1-logo-glass-vinyl.svg"
          alt="Parameter1"
        >
        <h1 class="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Page not found
        </h1>
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
      </div>
    </div>
  </splash-image-layout>
</template>

<script>
import SplashImageLayout from '../components/layouts/splash-image.vue';

export default {
  name: 'NotFoundPage',

  components: {
    SplashImageLayout,
  },
};
</script>
