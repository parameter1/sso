<template>
  <div class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
    <!-- swap here for a different sidebar style -->
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="flex h-16 flex-shrink-0 items-center bg-slate-900 px-4">
        <!-- logo -->
        <main-logo class="h-10 w-auto brightness-0 invert drop-shadow-md" />
      </div>

      <div class="flex flex-1 flex-col overflow-y-auto bg-slate-800">
        <!-- main nav -->
        <nav class="flex-1 px-2 py-4">
          <div class="space-y-1">
            <nav-item
              v-for="item in primaryNavItems"
              :key="item.name"
              :icon="item.icon"
              :name="item.name"
              :to="item.to"
            />
          </div>

          <div class="mt-5 border-t border-slate-900 pt-5">
            <div class="space-y-1">
              <a
                href="#logout"
                class="group flex items-center rounded-md px-3 py-2
                text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
                @click.prevent="$emit('logout')"
              >
                Logout
              </a>
            </div>
          </div>
        </nav>
      </div>
    </div>
  </div>
</template>

<script>
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
};
</script>
