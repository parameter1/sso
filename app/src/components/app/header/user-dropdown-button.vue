<template>
  <button
    :class="[
      active ? 'bg-slate-100': '',
      small ? 'text-sm' : 'text-base',
      'block w-full text-slate-700 hover:bg-slate-100 hover:text-slate-900',
      'group flex items-center px-2 py-2 font-base',
      'focus:outline-none focus:bg-slate-100 focus:text-slate-900'
    ]"
  >
    <component
      :is="icon"
      :class="[
        active ? 'text-blue-500' : 'text-slate-400',
        'group-hover:text-blue-500',
        'mr-2 h-5 w-5',
      ]"
      aria-hidden="true"
    />
    {{ name }}
  </button>
</template>

<script>
export default {
  name: 'AppHeaderUserDropdownButton',

  emits: ['click'],

  props: {
    active: {
      type: Boolean,
      default: false,
    },
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
  },
};
</script>
