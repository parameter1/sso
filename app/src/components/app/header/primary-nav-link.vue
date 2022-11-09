<template>
  <router-link
    :to="to"
    custom
    v-slot="{ href, isExactActive, navigate }"
  >
    <a
      :href="href"
      :class="[
        isExactActive
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
        small ? 'text-sm' : 'text-base',
        'group flex items-center px-2 py-2 font-medium rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus-ring-offset-2  '
      ]"
      :aria-current="isExactActive ? 'page' : undefined"
      @click.prevent="onClick(navigate)"
    >
      <component
        :is="icon"
        :class="[
          isExactActive
            ? 'text-blue-500'
            : 'text-slate-400 group-hover:text-blue-500',
          'mr-4 h-6 w-6',
        ]"
        aria-hidden="true"
      />
      {{ name }}
    </a>
  </router-link>
</template>

<script>
export default {
  name: 'AppHeaderPrimaryNavLink',

  emits: ['click'],

  props: {
    icon: {
      type: Function,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    small: {
      type: Boolean,
      default: false,
    },
    to: {
      type: String,
      required: true,
    },
  },

  methods: {
    onClick(navigate) {
      navigate();
      this.$emit('click');
    },
  },
};
</script>
