<template>
  <button
    :class="[
      small ? 'text-sm' : 'text-base',
      'block w-full text-slate-700 hover:bg-slate-100 hover:text-slate-900',
      'group flex items-center px-2 py-2 font-medium rounded-md',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus-ring-offset-2'
    ]"
  >
    <component
      :is="icon"
      :class="[
        'text-slate-400 group-hover:text-blue-500',
        small ? 'mr-2' : 'mr-4',
        'h-6 w-6',
      ]"
      aria-hidden="true"
    />
    {{ name }}
  </button>
</template>

<script>
export default {
  name: 'AppHeaderMobileMenuUserButton',

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
  },
};
</script>
