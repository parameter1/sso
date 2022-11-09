<template>
  <menu-container as="div" class="relative ml-4 flex-shrink-0">
    <div>
      <menu-button
        class="flex rounded-full bg-white
        focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
      >
        <span class="sr-only">Open user menu</span>
        <img class="h-10 w-10 rounded-full" :src="user.imageUrl" :alt="imageAlt">
      </menu-button>
    </div>
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <menu-items
        class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1
        shadow-lg ring-1 ring-blue-500 ring-opacity-5 focus:outline-none"
      >
        <menu-item
          v-for="item in navigation"
          :key="item.name"
          v-slot="{ active }"
        >
          <a
            :href="item.href"
            :class="[
              active ? 'bg-slate-100' : '',
              'block py-2 px-4 text-sm text-slate-700'
            ]"
          >
            {{ item.name }}
          </a>
        </menu-item>
      </menu-items>
    </transition>
  </menu-container>
</template>

<script>
import {
  Menu as MenuContainer,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/vue';

export default {
  name: 'AppHeaderUserDropdown',

  components: {
    MenuContainer,
    MenuButton,
    MenuItem,
    MenuItems,
  },

  props: {
    navigation: {
      type: Array,
      required: true,
    },
    user: {
      type: Object,
      required: true,
    },
  },

  computed: {
    imageAlt() {
      return `${this.user.name} Profile Image`;
    },
  },
};
</script>
