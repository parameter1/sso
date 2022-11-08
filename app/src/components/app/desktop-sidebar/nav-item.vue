<template>
  <a
    :href="to"
    :class="[
      current
        ? 'bg-blue-600 text-white shadow-sm focus:ring-offset-2 '
        : 'text-slate-900 hover:text-white hover:bg-blue-600 hover:shadow-sm',
      textSize === 'sm' ? 'text-sm' : 'text-base',
      'group flex items-center px-2 py-2 leading-6 font-medium rounded-md',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 hover:focus:ring-offset-2'
    ]"
    :aria-current="current ? 'page' : undefined"
  >
    <component
      :is="icon"
      :class="[
        current ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-200',
        'mr-4 h-6 w-6 flex-shrink-0',
      ]"
      aria-hidden="true"
    />
    {{ name }}
  </a>
</template>

<script>
export default {
  name: 'AppDesktopSidebarNavItem',

  props: {
    current: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: Function,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    to: {
      type: [String, Object],
      required: true,
    },
    textSize: {
      type: String,
      default: 'base',
      validator: (value) => new Set(['base', 'sm']).has(value),
    },
  },
};
</script>
