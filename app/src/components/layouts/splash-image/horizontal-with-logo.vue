<template>
  <splash-image-layout>
    <div class="mx-auto w-full max-w-sm lg:w-96">
      <div class="mb-8">
        <main-logo class="h-12 w-auto" />
        <h1 class="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          <slot name="header" />
        </h1>
      </div>
      <slot />
    </div>

    <slot name="bottom" />
  </splash-image-layout>
</template>

<script>
import MainLogo from '../../logos/parameter1-wide.vue';
import SplashImageLayout from '../splash-image.vue';

export default {
  name: 'HorizontalSplashImageLayoutWithLogo',

  components: {
    MainLogo,
    SplashImageLayout,
  },
};
</script>
