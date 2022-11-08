<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'SlideOverPanelBody',

  props: {
    class: {
      type: [String, Array, Object],
      default: null,
    },
    scrollWithin: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    classes() {
      const classes = ['flex-1'];
      if (this.class) {
        classes.push(this.class);
      } else {
        classes.push('p-4');
      }
      if (this.scrollWithin) classes.push('overflow-y-auto');
      return classes;
    },
  },
};
</script>
