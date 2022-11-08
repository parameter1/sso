<template>
  <dialog-title :class="classes">
    <slot />
  </dialog-title>
</template>

<script>
import { DialogTitle } from '@headlessui/vue';

export default {
  name: 'SlideOverPanelHeaderTitle',

  components: {
    DialogTitle,
  },

  props: {
    class: {
      type: [String, Array, Object],
      default: null,
    },
  },

  computed: {
    classes() {
      const classes = [];
      if (this.class) {
        classes.push(this.class);
      } else {
        classes.push('text-lg font-medium', 'text-slate-900');
      }
      return classes;
    },
  },
};
</script>
