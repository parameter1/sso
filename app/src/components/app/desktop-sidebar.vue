<template>
  <div class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
    <!-- swap here for a different sidebar style -->
    <div class="flex flex-grow flex-col overflow-y-auto bg-blue-700 pt-5 pb-4">
      <div class="flex flex-shrink-0 items-center px-4">
        <!-- logo -->
        <main-logo class="h-8 w-auto brightness-0 invert drop-shadow-md" />
      </div>

      <!-- main nav -->
      <nav class="mt-5 flex flex-1 flex-col divide-y divide-blue-800 overflow-y-auto">
        <!-- primary items -->
        <div class="space-y-1 px-2">
          <nav-item
            v-for="item in primaryNavItems"
            :key="item.name"
            :current="item.current"
            :icon="item.icon"
            :name="item.name"
            :to="item.to"
          />
        </div>

        <!-- secondary items -->
        <div class="mt-6 pt-6">
          <div class="space-y-1 px-2">
            <a
              href="#logout"
              class="group flex items-center rounded-md px-2 py-2
              text-sm font-medium leading-6 text-blue-100
              hover:bg-blue-600 hover:text-white hover:shadow-sm"
              @click.prevent="$emit('logout')"
            >
              <arrow-left-on-rectangle-icon class="mr-4 h-6 w-6 text-blue-200" aria-hidden="true" />
              Logout
            </a>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>

<script>
import { ArrowLeftOnRectangleIcon } from '@heroicons/vue/20/solid';
import MainLogo from '../logos/parameter1-wide.vue';
import NavItem from './desktop-sidebar/nav-item.vue';

export default {
  name: 'AppDesktopSidebar',

  emits: ['logout'],

  components: {
    ArrowLeftOnRectangleIcon,
    MainLogo,
    NavItem,
  },

  props: {
    primaryNavItems: {
      type: Array,
      default: () => [],
    },
  },
};
</script>
