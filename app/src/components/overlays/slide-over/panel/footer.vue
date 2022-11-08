<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'SlideOverPanelFooter',

  props: {
    class: {
      type: [String, Array, Object],
      default: null,
    },
  },

  computed: {
    classes() {
      const classes = ['flex-shrink-0'];
      if (this.class) {
        classes.push(this.class);
      } else {
        classes.push('p-4');
      }
      return classes;
    },
  },
};
</script>
