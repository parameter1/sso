<template>
  <a
    :href="to"
    :class="[
      current ? 'bg-slate-900 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white',
      'group flex items-center px-2 py-2 font-medium rounded-md'
    ]"
    :aria-current="current ? 'page' : undefined"
  >
    <component
      :is="icon"
      :class="[
        current ? 'text-slate-300' : 'text-slate-400 group-hover:text-blue-300',
        'mr-3 flex-shrink-0 h-6 w-6'
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

  computed: {
    current() {
      return false;
    },
  },
};
</script>
