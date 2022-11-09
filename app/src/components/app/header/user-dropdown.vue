<template>
  <menu-container as="div" class="relative ml-4 flex-shrink-0">
    <div>
      <menu-button
        class="flex rounded-full bg-white
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        <span class="sr-only">Open user menu</span>
        <user-image
          :initials="user.name.initials"
          :name="user.name.full"
          :src="user.image.src"
          :srcset="user.image.srcset"
        />
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
        <div class="py-2 px-4">
          <div class="text-sm font-medium text-slate-800">
            {{ user.name.full }}
          </div>
          <div class="text-xs font-medium text-slate-500 truncate">
            {{ user.email.address }}
          </div>
        </div>
        <div>
          <menu-item as="div" v-slot="{ active }">
            <user-button
              name="My Profile"
              :active="active"
              :icon="UserIcon"
              small
              @click="$emit('profile')"
            />
          </menu-item>
          <menu-item as="div" v-slot="{ active }">
            <user-button
              name="Logout"
              :active="active"
              :icon="ArrowLeftOnRectangleIcon"
              small
              @click="$emit('logout')"
            />
          </menu-item>
        </div>
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
import { ArrowLeftOnRectangleIcon, UserIcon } from '@heroicons/vue/24/outline';
import UserButton from './user-dropdown-button.vue';
import UserImage from './user-image.vue';

export default {
  name: 'AppHeaderUserDropdown',

  emits: ['logout', 'profile'],

  components: {
    MenuContainer,
    MenuButton,
    MenuItem,
    MenuItems,
    UserButton,
    UserImage,
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

  data: () => ({
    ArrowLeftOnRectangleIcon,
    UserIcon,
  }),
};
</script>
