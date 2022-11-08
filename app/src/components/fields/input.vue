<template>
  <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)">
</template>

<script>
import { nextFrame } from '../../utils/next-frame';

export default {
  name: 'InputField',

  emits: ['update:modelValue'],

  props: {
    autofocus: {
      type: Boolean,
      default: false,
    },

    modelValue: {
      type: String,
      default: null,
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
