<template>
  <alert-element v-if="error" :header="header">
    {{ error }}
  </alert-element>
</template>

<script>
import AlertElement from './alert.vue';

export default {
  name: 'ErrorAlert',

  components: {
    AlertElement,
  },

  props: {
    error: {
      type: Error,
      default: null,
    },

    header: {
      type: String,
      default: 'Error',
    },
  },
};
</script>
