<template>
  <transition-root as="template" :show="open">
    <div class="lg:hidden">
      <transition-child
        as="template"
        enter="duration-150 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <popover-overlay
          class="fixed inset-0 z-20 bg-black bg-opacity-25"
          aria-hidden="true"
        />
      </transition-child>

      <transition-child
        as="template"
        enter="duration-150 ease-out"
        enter-from="opacity-0 scale-95"
        enter-to="opacity-100 scale-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100 scale-100"
        leave-to="opacity-0 scale-95"
      >
        <popover-panel
          focus
          class="absolute top-0 right-0 z-30 w-full max-w-none
          origin-top transform p-2 transition"
          v-slot="{ close }"
        >
          <div
            class="divide-y divide-slate-200 rounded-lg bg-white shadow-lg
            ring-1 ring-black ring-opacity-5"
          >
            <div class="pt-3 pb-2">
              <!-- logo and close button -->
              <div class="flex items-center justify-between px-4">
                <!-- logo -->
                <div>
                  <main-logo class="h-8 w-auto" />
                </div>
                <!-- close button -->
                <div class="-mr-2">
                  <popover-button
                    class="inline-flex items-center justify-center rounded-md bg-white
                    p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500
                    focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  >
                    <span class="sr-only">Close menu</span>
                    <x-mark-icon class="h-6 w-6" aria-hidden="true" />
                  </popover-button>
                </div>
              </div>
              <!-- primary nav items -->
              <nav class="mt-3 space-y-1 px-2">
                <nav-item
                  v-for="item in primaryNavItems"
                  :key="item.name"
                  :name="item.name"
                  :icon="item.icon"
                  :to="item.to"
                  @click="close"
                />
              </nav>
            </div>

            <div class="pt-4 pb-2">
              <!-- user info -->
              <div class="flex items-center px-5">
                <!-- user image -->
                <div class="flex-shrink-0">
                  <user-image
                    :initials="user.name.initials"
                    :name="user.name.full"
                    :src="user.image.src"
                    :srcset="user.image.srcset"
                  />
                </div>
                <!-- user deats -->
                <div class="ml-3">
                  <div class="text-base font-medium text-slate-800">
                    {{ user.name.full }}
                  </div>
                  <div class="text-sm font-medium text-slate-500">
                    {{ user.email.address }}
                  </div>
                </div>
              </div>

              <!-- user nav -->
              <div class="mt-3 space-y-1 px-2">
                <user-button
                  name="My Profile"
                  :icon="UserIcon"
                  @click="$emit('profile'); close()"
                />

                <user-button
                  name="Logout"
                  :icon="ArrowLeftOnRectangleIcon"
                  @click="$emit('logout'); close()"
                />
              </div>
            </div>
          </div>
        </popover-panel>
      </transition-child>
    </div>
  </transition-root>
</template>

<script>
import {
  PopoverButton,
  PopoverOverlay,
  PopoverPanel,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';
import { ArrowLeftOnRectangleIcon, UserIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import MainLogo from '../../logos/parameter1-wide.vue';
import NavItem from './primary-nav-link.vue';
import UserButton from './mobile-menu-user-button.vue';
import UserImage from './user-image.vue';

export default {
  name: 'AppHeaderMobileMenu',

  emits: ['logout', 'profile'],

  components: {
    PopoverButton,
    PopoverOverlay,
    PopoverPanel,
    MainLogo,
    NavItem,
    TransitionChild,
    TransitionRoot,
    UserButton,
    UserImage,
    XMarkIcon,
  },

  props: {
    open: {
      type: Boolean,
      default: false,
    },

    primaryNavItems: {
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
