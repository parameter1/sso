<template>
  <div class="flex items-center">
    <input
      id="login-remember-me"
      type="checkbox"
      class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', !modelValue)"
    >
    <label for="login-remember-me" class="ml-2 block text-sm text-slate-900">
      Remember me
    </label>
  </div>
</template>

<script>
export default {
  name: 'LoginRememberMe',

  emits: ['update:modelValue'],

  props: {
    disabled: {
      type: Boolean,
      default: false,
    },

    modelValue: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
