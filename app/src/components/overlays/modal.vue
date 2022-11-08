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
      <modal-backdrop v-if="backdrop" />

      <!-- main -->
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div
          class="flex min-h-full items-start justify-center p-4 text-center md:p-0"
        >
          <transition-child
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <modal-panel v-bind="panel" @close="$emit('close')">
              <slot />
            </modal-panel>
          </transition-child>
        </div>
      </div>
    </dialog-container>
  </transition-root>
</template>

<script>
import { Dialog as DialogContainer, TransitionChild, TransitionRoot } from '@headlessui/vue';
import ModalBackdrop from './modal/backdrop.vue';
import ModalPanel from './modal/panel.vue';

export default {
  emits: ['afterClose', 'close'],

  name: 'ModalOverlay',

  components: {
    DialogContainer,
    ModalBackdrop,
    ModalPanel,
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
