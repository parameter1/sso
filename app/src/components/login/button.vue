<template>
  <button
    type="submit"
    :class="classes"
    :disabled="disabled || loading"
  >
    <loading-spinner v-if="loading" color="white" />
    <span v-else>
      <slot />
    </span>
  </button>
</template>

<script>
import LoadingSpinner from '../loading-spinner.vue';

export default {
  name: 'LoginButton',

  components: {
    LoadingSpinner,
  },

  props: {
    disabled: {
      type: Boolean,
      default: false,
    },

    loading: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    classes() {
      const classes = [
        'flex',
        'w-full',
        'justify-center',
        'rounded-md',
        'border',
        'border-transparent',
        'bg-blue-600',
        'py-2',
        'px-4',
        'text-sm',
        'font-medium',
        'text-white',
        'shadow-sm',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-blue-500',
        'focus:ring-offset-2',
      ];
      if (!this.loading && !this.disabled) {
        classes.push('hover:bg-blue-700');
      }
      return classes;
    },
  },
};
</script>
