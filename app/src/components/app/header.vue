<template>
  <popover-container as="header" class="bg-white shadow" v-slot="{ open }">
    <div class="mx-auto max-w-7xl px-2 sm:divide-y sm:divide-slate-200 sm:px-4 lg:px-8">
      <!-- top row -->
      <div class="flex h-16 justify-between">
        <!-- logo -->
        <div class="flex px-2 sm:px-0">
          <div class="flex flex-shrink-0 items-center">
            <main-logo class="block h-8 w-auto" />
          </div>
        </div>

        <!-- center column -->
        <div class="flex flex-1" />

        <!-- mobile menu button -->
        <div class="flex items-center sm:hidden">
          <mobile-menu-button />
        </div>

        <!-- mobile menu -->
        <mobile-menu
          :open="open"
          :primary-nav-items="primaryNavItems"
          :user="user"
          @logout="logout"
        />

        <!-- user dropdown -->
        <div class="hidden sm:ml-4 sm:flex sm:items-center">
          <user-dropdown :user="user" @logout="logout" />
        </div>
      </div>

      <!-- second row: desktop nav -->
      <nav class="hidden sm:flex sm:space-x-4 sm:py-2" aria-label="Global">
        <nav-item
          v-for="item in primaryNavItems"
          :key="item.name"
          :name="item.name"
          :icon="item.icon"
          :to="item.to"
          small
        />
      </nav>
    </div>
  </popover-container>
</template>

<script>
import { Popover as PopoverContainer } from '@headlessui/vue';
import { HomeIcon, BuildingOffice2Icon } from '@heroicons/vue/24/outline';

import MainLogo from '../logos/parameter1-wide.vue';
import MobileMenu from './header/mobile-menu.vue';
import MobileMenuButton from './header/mobile-menu-button.vue';
import NavItem from './header/primary-nav-link.vue';
import UserDropdown from './header/user-dropdown.vue';

import userService from '../../services/user';

export default {
  name: 'AppHeader',

  components: {
    MainLogo,
    MobileMenu,
    MobileMenuButton,
    NavItem,
    PopoverContainer,
    UserDropdown,
  },

  props: {
    user: {
      type: Object,
      required: true,
    },
  },

  data: () => ({
    primaryNavItems: [{
      name: 'Dashboard',
      to: '/manage',
      icon: HomeIcon,
    }, {
      name: 'Organizations',
      to: '/manage/organizations',
      icon: BuildingOffice2Icon,
    }],
  }),

  methods: {
    async logout() {
      await userService.logout();
    },
  },
};
</script>
