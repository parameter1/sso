<template>
  <div role="alert">
    <slot name="header">
      <h3>
        {{ header }}
      </h3>
    </slot>
    <p>
      <slot />
    </p>
  </div>
</template>

<script>
export default {
  name: 'AlertElement',

  props: {
    header: {
      type: String,
      default: null,
    },
  },
};
</script>
