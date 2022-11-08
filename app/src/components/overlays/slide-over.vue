<template>
  <transition-root
    as="template"
    :appear="appear"
    :show="open"
    @after-leave="$emit('afterClose')"
  >
    <dialog-container
      as="aside"
      :class="containerClasses"
      @close="$emit('close')"
    >
      <!-- backdrop -->
      <slide-over-backdrop v-if="backdrop" />

      <!-- main -->
      <div class="fixed inset-0 overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <transition-child
              as="template"
              enter="transform transition ease-in-out duration-300"
              enter-from="translate-x-full"
              enter-to="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leave-from="translate-x-0"
              leave-to="translate-x-full"
            >
              <slide-over-panel v-bind="panel" @close="$emit('close', false)">
                <template v-for="(_, name) in $slots" #[name]>
                  <slot :name="name" />
                </template>
              </slide-over-panel>
            </transition-child>
          </div>
        </div>
      </div>
    </dialog-container>
  </transition-root>
</template>

<script>
import { Dialog as DialogContainer, TransitionChild, TransitionRoot } from '@headlessui/vue';

import SlideOverBackdrop from './slide-over/backdrop.vue';
import SlideOverPanel from './slide-over/panel.vue';

export default {
  emits: ['afterClose', 'close'],

  components: {
    DialogContainer,
    SlideOverBackdrop,
    SlideOverPanel,
    TransitionChild,
    TransitionRoot,
  },

  props: {
    appear: {
      type: Boolean,
      default: false,
    },
    backdrop: {
      type: Boolean,
      default: false,
    },
    open: {
      type: Boolean,
      default: false,
    },
    panel: {
      type: Object,
      default: () => ({}),
    },
    z: {
      type: [Number, String],
      default: 20,
      validator: (v) => [10, 20, 30].includes(parseInt(v, 10)),
    },
  },

  computed: {
    containerClasses() {
      const classes = ['relative'];
      const map = {
        10: 'z-10',
        20: 'z-20',
        30: 'z-30',
      };
      const z = map[this.z];
      if (z) classes.push(z);
      return classes;
    },
  },
};
</script>
