<template>
  <div class="p-4">
    <h2 class="text-lg font-medium text-slate-900">
      Login Help
    </h2>
    <p class="mt-1 text-sm text-slate-500">
      Having trouble logging in or need access to the Parameter1 ecosystem?
    </p>

    <ul
      role="list"
      class="mt-6 grid grid-cols-1 gap-6 border-t border-b border-slate-200 py-6 sm:grid-cols-2"
    >
      <li v-for="(item, index) in items" :key="index" class="flow-root">
        <div
          class="relative -m-2 flex items-center space-x-4 rounded-xl p-2
          focus-within:ring-2 focus-within:ring-blue-500 hover:bg-slate-50"
        >
          <div
            :class="[
              item.background,
              'flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-lg'
            ]"
          >
            <component :is="item.icon" class="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-900">
              <a href="#" class="focus:outline-none">
                <span class="absolute inset-0" aria-hidden="true" />
                <span>{{ item.title }}</span>
                <span aria-hidden="true"> &rarr;</span>
              </a>
            </h3>
            <p class="mt-1 text-sm text-slate-500">
              {{ item.description }}
            </p>
          </div>
        </div>
      </li>
    </ul>
    <div class="mt-4 flex text-sm font-medium text-slate-900 gap-2">
      Something else?
      <a
        href="mailto:support@parameter1.com"
        class="text-blue-600 hover:text-blue-500"
      >
        Contact <span class="italic">support@parameter1.com</span>
        <span aria-hidden="true"> &rarr;</span>
      </a>
    </div>
  </div>
</template>

<script>
import {
  ChatBubbleOvalLeftEllipsisIcon,
  EnvelopeIcon,
  LockOpenIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline';

export default {
  name: 'LoginHelpPanel',

  data: () => ({
    items: [{
      title: 'Get Access',
      description: 'Contact your organization manager to create an account.',
      icon: LockOpenIcon,
      background: 'bg-indigo-500',
    },
    {
      title: 'Login Email Help',
      description: 'Ensure emails from us are delivering to your inbox.',
      icon: EnvelopeIcon,
      background: 'bg-yellow-500',
    },
    {
      title: 'Manage Users',
      description: 'Already an org manager? Learn how to add new user accounts.',
      icon: UserGroupIcon,
      background: 'bg-green-500',
    },
    {
      title: 'Contact Sales',
      description: 'Are you new to the Parameter1 platform? Contact sales to get started.',
      icon: ChatBubbleOvalLeftEllipsisIcon,
      background: 'bg-purple-500',
    }],
  }),
};
</script>
