<template>
  <field-group
    type="text"
    autocomplete="given-name"
    :id="id"
    :label="label"
    :index="index"
    :required="required"
    :disabled="disabled"
    :model-value="modelValue"
    @did-change="$emit('didChange', $event)"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script>
import FieldGroup from '../group.vue';

export default {
  name: 'UserEmailField',

  emits: ['didChange', 'update:modelValue'],

  components: {
    FieldGroup,
  },

  props: {
    id: {
      type: String,
      default: 'user-given-name',
    },

    label: {
      type: String,
      default: 'First Name',
    },

    modelValue: {
      type: String,
      default: null,
    },

    required: {
      type: Boolean,
      default: true,
    },

    disabled: {
      type: Boolean,
      default: false,
    },

    index: {
      type: Number,
      default: null,
    },
  },
};
</script>
