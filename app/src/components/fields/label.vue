<template>
  <label>
    <span>
      <slot />
    </span>
    <span v-if="required">
      *
    </span>
  </label>
</template>

<script>

export default {
  name: 'FieldLabel',

  props: {
    required: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
