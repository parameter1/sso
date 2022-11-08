<template>
  <header :class="classes">
    <header-title v-if="hasTitleSlot" :class="titleClass">
      <slot name="title" />
    </header-title>
    <header-description v-if="hasDescriptionSlot" :class="descriptionClass">
      <slot name="description" />
    </header-description>
  </header>
</template>

<script>
import HeaderDescription from './header/description.vue';
import HeaderTitle from './header/title.vue';

export default {
  name: 'SlideOverPanelHeader',

  components: {
    HeaderDescription,
    HeaderTitle,
  },

  props: {
    class: {
      type: [String, Array, Object],
      default: null,
    },
    descriptionClass: {
      type: [String, Object, Array],
      default: null,
    },
    titleClass: {
      type: [String, Object, Array],
      default: null,
    },
  },

  computed: {
    classes() {
      const classes = [];
      if (this.class) {
        classes.push(this.class);
      } else {
        classes.push('space-y-1', 'bg-slate-200/70', 'p-4');
      }
      return classes;
    },

    hasDescriptionSlot() {
      return Boolean(this.$slots.description && this.$slots.description());
    },

    hasTitleSlot() {
      return Boolean(this.$slots.title && this.$slots.title());
    },
  },
};
</script>
