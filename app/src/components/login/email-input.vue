<template>
  <input-field
    id="email"
    type="email"
    autocomplete="email"
    :model-value="modelValue"
    class="block w-full appearance-none rounded-md
    border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm
    caret-blue-600
    focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
    required
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script>
import InputField from '../fields/input.vue';

export default {
  name: 'LoginEmailInput',

  emits: ['update:modelValue'],

  components: {
    InputField,
  },

  props: {
    modelValue: {
      type: String,
      default: null,
    },
  },
};
</script>
