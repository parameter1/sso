<template>
  <component
    :is="component"
    :primary-nav-items="primaryNavItems"
    @logout="$emit('logout')"
  />
</template>

<script>
import { BuildingOffice2Icon, HomeIcon, UserCircleIcon } from '@heroicons/vue/24/outline';
import DesktopSidebar from './desktop-sidebar.vue';

export default {
  name: 'AppSidebar',

  emits: ['logout'],

  props: {
    mobile: {
      type: Boolean,
      default: false,
    },
  },

  data: () => ({
    primaryNavItems: [{
      name: 'Dashboard',
      to: '#',
      icon: HomeIcon,
    }, {
      name: 'My Profile',
      to: '#',
      icon: UserCircleIcon,
    }, {
      name: 'Manage Organizations',
      to: '#',
      icon: BuildingOffice2Icon,
    }],
  }),

  computed: {
    component() {
      return DesktopSidebar;
    },
  },
};
</script>
