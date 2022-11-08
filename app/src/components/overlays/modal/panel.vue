<template>
  <dialog-panel :class="classes">
    <div class="absolute flex top-2 right-2">
      <button
        type="button"
        class="
        transition
        text-slate-400 rounded-lg p-0.5
        hover:text-slate-500
        hover:bg-slate-200
        focus:outline-none focus:ring-2 focus:ring-blue-500
        focus:bg-white focus:shadow-inner
        "
        @click="$emit('close')"
      >
        <x-mark-icon class="h-6 w-6" />
      </button>
    </div>

    <slot />
  </dialog-panel>
</template>

<script>
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { DialogPanel } from '@headlessui/vue';

export default {
  emits: ['close'],
  name: 'ModalPanel',

  components: {
    DialogPanel,
    XMarkIcon,
  },

  props: {
    bgColor: {
      default: 'white',
      validator: (bgColor) => new Set(['white', 'slate-50', 'slate-100']).has(bgColor),
    },
  },

  computed: {
    classes() {
      const classes = [
        'relative',
        'transform',
        'overflow-hidden',
        'rounded-lg',
        'text-left',
        'shadow-xl',
        'transition-all',
        'w-full',
        'sm:my-16',
        'sm:max-w-2xl',
        'md:max-w-3xl',
        // 'lg:max-w-4xl',
        'pointer-events-auto',
      ];

      const { bgColor } = this;
      const bgColors = {
        'slate-50': 'bg-slate-50',
        'slate-100': 'bg-slate-100',
      };
      classes.push(bgColors[bgColor] || 'bg-white');
      return classes;
    },
  },
};
</script>
