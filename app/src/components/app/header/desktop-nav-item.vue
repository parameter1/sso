<template>
  <router-link
    :to="to"
    custom
    v-slot="{ href, isExactActive, navigate }"
  >
    <a
      :href="href"
      :class="[
        isExactActive ? 'bg-slate-100' : '',
        'inline-flex items-center rounded-md py-2 px-3',
        'text-sm font-medium text-slate-900 hover:bg-slate-50 hover:text-slate-900'
      ]"
      :aria-current="isExactActive ? 'page' : undefined"
      @click="navigate"
    >
      <slot />
    </a>
  </router-link>
</template>

<script>
export default {
  name: 'AppHeaderDesktopNavItem',

  props: {
    current: {
      type: Boolean,
      default: false,
    },
    to: {
      type: String,
      required: true,
    },
  },
};
</script>
