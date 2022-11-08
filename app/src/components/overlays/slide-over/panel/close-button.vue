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
    <div class="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4">
      <button
        type="button"
        :class="buttonClasses"
        @click="$emit('click')"
      >
        <span class="sr-only">Close panel</span>
        <x-mark-icon class="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  </transition-child>
</template>

<script>
import { TransitionChild } from '@headlessui/vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'SlideOverCloseButton',

  emits: ['click'],

  components: {
    TransitionChild,
    XMarkIcon,
  },

  data: () => ({
    buttonClasses: [
      'rounded-md',
      'text-slate-300',
      'hover:text-white',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-white',
    ],
  }),
};
</script>
