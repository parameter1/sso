<template>
  <div>
    <field-label :for="identifier" :required="required">
      {{ label }}
    </field-label>
    <input
      :id="identifier"
      :type="type"
      :required="required"
      :disabled="disabled"
      :readonly="readonly"
      :autocomplete="autocomplete"
      :value="value"
      @input="emitChange"
      v-bind="attrs"
      v-on="events"
    >
  </div>
</template>

<script>
import FieldLabel from './label.vue';

export default {
  name: 'EditPageFieldGroup',

  emits: ['didChange', 'update:modelValue'],

  components: {
    FieldLabel,
  },

  props: {
    id: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    modelValue: {
      type: [String, Number],
      default: null,
    },
    type: {
      type: String,
      default: 'text',
    },
    required: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    autocomplete: {
      type: String,
      default: null,
    },
    attrs: {
      type: Object,
      default: () => ({}),
    },
    events: {
      type: Object,
      default: () => ({}),
    },
    index: {
      type: Number,
      default: null,
    },
  },

  data: () => ({
    didSetInitialValue: false,
    initialValue: null,
  }),

  computed: {
    identifier() {
      const { id, index } = this;
      if (index == null) return id;
      return `${id}-${index}`;
    },
    value() {
      const { modelValue } = this;
      if (!modelValue) return modelValue;
      // if (type === 'datetime-local') {
      //   return dayjs(modelValue).format('YYYY-MM-DDThh:mm');
      // }
      return modelValue;
    },
  },

  methods: {
    emitChange(event) {
      const { resolveValue: r } = this;
      const { value } = event.target;
      if (!this.didSetInitialValue) {
        this.initialValue = this.value;
        this.didSetInitialValue = true;
      }
      this.$emit('didChange', r(this.initialValue) !== r(value));
      this.$emit('update:modelValue', value);
    },
    resetInitialValue() {
      this.initialValue = null;
      this.didSetInitialValue = false;
    },
    resolveValue(v) {
      if (this.type === 'number') {
        if ([0, '0'].includes(v)) return 0;
        if (v == null || ['null', 'undefined'].includes(v)) return null;
        return parseInt(v, 10);
      }
      return v || null;
    },
  },
};
</script>
