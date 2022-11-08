<template>
  <dialog-panel :class="classes">
    <div class="flex h-full flex-col overflow-y-auto bg-white shadow-xl divide-y divide-slate-300">
      <slot name="header">
        <panel-header
          v-if="hasHeaderSlots"
          :class="headerClass"
          :title-class="titleClass"
          :description-class="descriptionClass"
        >
          <template v-for="(_, name) in $slots" #[name]>
            <slot :name="name" />
          </template>
        </panel-header>
      </slot>
      <panel-body :scroll-within="scrollWithinBody" :class="bodyClass">
        <slot name="body" />
      </panel-body>
      <panel-footer v-if="hasFooterSlot" :class="footerClass">
        <slot name="footer" />
      </panel-footer>
    </div>
    <close-button v-if="closeButton" @click="$emit('close')" />
  </dialog-panel>
</template>

<script>
import { DialogPanel } from '@headlessui/vue';
import CloseButton from './panel/close-button.vue';
import PanelBody from './panel/body.vue';
import PanelFooter from './panel/footer.vue';
import PanelHeader from './panel/header.vue';

export default {
  name: 'SlideOverPanel',

  emits: ['close'],

  components: {
    CloseButton,
    DialogPanel,
    PanelBody,
    PanelFooter,
    PanelHeader,
  },

  props: {
    bodyClass: {
      type: [String, Array, Object],
      default: null,
    },
    descriptionClass: {
      type: [String, Array, Object],
      default: null,
    },
    closeButton: {
      type: Boolean,
      default: false,
    },
    footerClass: {
      type: [String, Array, Object],
      default: null,
    },
    headerClass: {
      type: [String, Array, Object],
      default: null,
    },
    scrollWithinBody: {
      type: Boolean,
      default: false,
    },
    titleClass: {
      type: [String, Array, Object],
      default: null,
    },
    width: {
      type: String,
      default: 'md',
      validator: (width) => new Set(['md', 'lg', 'xl', '2xl']).has(width),
    },
  },

  computed: {
    classes() {
      const classes = ['pointer-events-auto', 'relative', 'w-screen'];
      const { width } = this;
      const widths = { lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' };
      classes.push(widths[width] || 'max-w-md');

      return classes;
    },

    hasHeaderSlots() {
      return Boolean(this.$slots.description && this.$slots.description())
        || Boolean(this.$slots.title && this.$slots.title());
    },

    hasFooterSlot() {
      return Boolean(this.$slots.footer && this.$slots.footer());
    },
  },
};
</script>
