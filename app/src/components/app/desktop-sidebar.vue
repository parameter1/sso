<template>
  <div class="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:w-64 xl:w-72">
    <!-- swap here for a different sidebar style -->
    <div class="flex flex-grow flex-col overflow-y-auto bg-white pt-4 pb-4">
      <div class="flex flex-shrink-0 items-center px-4 border-b border-slate-300 pb-4">
        <!-- logo -->
        <main-logo class="h-10 w-auto" />
      </div>

      <!-- main nav -->
      <nav class="mt-5 flex flex-1 flex-col divide-y divide-slate-300 overflow-y-auto">
        <!-- primary items -->
        <div class="space-y-1 px-2 py-2">
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
            <nav-item
              :icon="ArrowLeftOnRectangleIcon"
              name="Logout"
              to="#logout"
              text-size="sm"
              @click.prevent="$emit('logout')"
            />
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
    MainLogo,
    NavItem,
  },

  props: {
    primaryNavItems: {
      type: Array,
      default: () => [],
    },
  },

  data: () => ({
    ArrowLeftOnRectangleIcon,
  }),
};
</script>
