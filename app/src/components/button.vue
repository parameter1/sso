<template>
  <button>
    <slot />
  </button>
</template>

<script>
import { nextFrame } from '../utils/next-frame';

export default {
  name: 'ButtonElement',

  props: {
    autofocus: {
      type: Boolean,
      default: false,
    },
  },

  mounted() {
    this.handleAutofocus();
  },

  watch: {
    autofocus() {
      this.handleAutofocus();
    },
  },

  methods: {
    blur() {
      this.$el.blur();
    },

    focus() {
      this.$el.focus();
    },

    handleAutofocus() {
      nextFrame(() => {
        if (this.autofocus) this.focus();
      });
    },
  },
};
</script>
