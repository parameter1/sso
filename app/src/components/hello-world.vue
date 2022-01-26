<template>
  <p>Hello {{ name }}</p>
</template>

<script>
export default {
  props: {
    name: {
      type: String,
      default: 'World',
    },
  },
};
</script>
