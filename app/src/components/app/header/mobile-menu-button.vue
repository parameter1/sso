<template>
  <popover-button
    class="inline-flex items-center justify-center rounded-md p-2 text-slate-400
    hover:bg-slate-100 hover:text-slate-500
    focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
  >
    <span class="sr-only">Open main menu</span>
    <bars-3-icon class="block h-6 w-6" aria-hidden="true" />
  </popover-button>
</template>

<script>
import { PopoverButton } from '@headlessui/vue';
import { Bars3Icon } from '@heroicons/vue/24/outline';

export default {
  name: 'AppHeaderMobileMenuButton',

  components: {
    Bars3Icon,
    PopoverButton,
  },
};
</script>
