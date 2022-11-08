<template>
  <a
    :href="to"
    :class="[
      current
        ? 'bg-blue-800 text-white'
        : 'text-blue-100 hover:text-white hover:bg-blue-600',
      'group flex items-center px-2 py-2 text-sm leading-6 font-medium rounded-md'
    ]"
    :aria-current="current ? 'page' : undefined"
  >
    <component
      :is="icon"
      class="mr-4 h-6 w-6 flex-shrink-0 text-blue-200"
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
  },
};
</script>
