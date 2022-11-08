<template>
  <transition-child
    as="template"
    enter="ease-in-out duration-300"
    enter-from="opacity-0"
    enter-to="opacity-100"
    leave="ease-in-out duration-300"
    leave-from="opacity-100"
    leave-to="opacity-0"
  >
    <div class="fixed inset-0 bg-black/60 transition-opacity" />
  </transition-child>
</template>

<script>
import { TransitionChild } from '@headlessui/vue';

export default {
  name: 'SlideOverBackdrop',

  components: {
    TransitionChild,
  },
};
</script>
