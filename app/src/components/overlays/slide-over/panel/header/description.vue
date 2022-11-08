<template>
  <p :class="classes">
    <slot />
  </p>
</template>

<script>
export default {
  name: 'SlideOverPanelHeaderDescription',

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
        classes.push('text-sm', 'text-slate-600');
      }
      return classes;
    },
  },
};
</script>
