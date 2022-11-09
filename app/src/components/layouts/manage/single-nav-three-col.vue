<template>
  <div class="min-h-full">
    <!-- When the mobile menu is open, add `overflow-hidden` to the `body`
    element to prevent double scrollbars -->
    <popover-container as="template" v-slot="{ open }">
      <header
        :class="[
          open
            ? 'fixed inset-0 z-40 overflow-y-auto'
            : '',
          'bg-white shadow-sm lg:static lg:overflow-y-visible'
        ]"
      >
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="relative flex justify-between lg:gap-8 xl:grid xl:grid-cols-12">
            <div class="flex md:absolute md:inset-y-0 md:left-0 lg:static xl:col-span-2">
              <div class="flex flex-shrink-0 items-center">
                <img class="block h-8 w-auto" src="https://tailwindui.com/img/logos/mark.svg?color=blue&shade=500" alt="Your Company">
              </div>
            </div>

            <div class="min-w-0 flex-1 md:px-8 lg:px-0 xl:col-span-6">
              <div
                class="flex items-center px-6 py-4
                md:mx-auto md:max-w-3xl lg:mx-0 lg:max-w-none xl:px-0"
              >
                <div class="w-full">
                  <label for="search" class="sr-only">
                    Search
                  </label>
                  <div class="relative">
                    <div
                      class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
                    >
                      <magnifying-glass-icon class="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                      id="search"
                      name="search"
                      class="block w-full rounded-md border border-slate-300 bg-white
                      py-2 pl-10 pr-3 text-sm placeholder-slate-500
                      focus:border-blue-500 focus:text-slate-900 focus:placeholder-slate-400
                      focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      placeholder="Search"
                      type="search"
                    >
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center md:absolute md:inset-y-0 md:right-0 lg:hidden">
              <!-- Mobile menu button -->
              <popover-button
                class="-mx-2 inline-flex items-center justify-center rounded-md
                p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500
                focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span class="sr-only">Open menu</span>
                <bars-3-icon v-if="!open" class="block h-6 w-6" aria-hidden="true" />
                <x-mark-icon v-else class="block h-6 w-6" aria-hidden="true" />
              </popover-button>
            </div>

            <div class="hidden lg:flex lg:items-center lg:justify-end xl:col-span-4">
              <a href="#" class="text-sm font-medium text-slate-900 hover:underline">
                Go Premium
              </a>
              <a
                href="#"
                class="ml-5 flex-shrink-0 rounded-full bg-white p-1
                text-slate-400 hover:text-slate-500
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span class="sr-only">View notifications</span>
                <bell-icon class="h-6 w-6" aria-hidden="true" />
              </a>

              <!-- Profile dropdown -->
              <menu-container as="div" class="relative ml-5 flex-shrink-0">
                <div>
                  <menu-button
                    class="flex rounded-full bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span class="sr-only">Open user menu</span>
                    <img class="h-8 w-8 rounded-full" :src="user.imageUrl" alt="">
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
                    class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md
                    bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <menu-item v-for="item in userNavigation" :key="item.name" v-slot="{ active }">
                      <a
                        :href="item.href"
                        :class="[
                          active
                            ? 'bg-slate-100'
                            : '',
                          'block py-2 px-4 text-sm text-slate-700'
                        ]"
                      >
                        {{ item.name }}
                      </a>
                    </menu-item>
                  </menu-items>
                </transition>
              </menu-container>

              <a
                href="#"
                class="ml-6 inline-flex items-center rounded-md border border-transparent
                bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm
                hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                focus:ring-offset-2"
              >
                New Post
              </a>
            </div>
          </div>
        </div>
      </header>
    </popover-container>

    <!-- main content -->
    <div class="py-10">
      <div class="mx-auto max-w-3xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-12 lg:gap-8 lg:px-8">
        <div class="hidden lg:col-span-3 lg:block xl:col-span-2">
          <nav aria-label="Sidebar" class="sticky top-4 divide-y divide-slate-300">
            <div class="space-y-1 pb-8">
              <a
                v-for="item in primaryNavItems"
                :key="item.name"
                :href="item.to"
                :class="[
                  item.current
                    ? 'bg-slate-200 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                ]"
                :aria-current="item.current ? 'page' : undefined"
              >
                <component
                  :is="item.icon"
                  :class="[
                    item.current
                      ? 'text-slate-500'
                      : 'text-slate-400 group-hover:text-slate-500',
                    'flex-shrink-0 -ml-1 mr-3 h-6 w-6'
                  ]"
                  aria-hidden="true"
                />
                <span class="truncate">{{ item.name }}</span>
              </a>
            </div>

            <div class="pt-10">
              <p class="px-3 text-sm font-medium text-slate-500" id="communities-headline">
                Communities
              </p>
              <div class="mt-3 space-y-2" aria-labelledby="communities-headline">
                <a
                  v-for="community in communities"
                  :key="community.name"
                  :href="community.href"
                  class="group flex items-center rounded-md px-3 py-2 text-sm font-medium
                  text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <span class="truncate">{{ community.name }}</span>
                </a>
              </div>
            </div>
          </nav>
        </div>

        <main class="lg:col-span-9 xl:col-span-6">
          <!-- tabs -->
          <div class="px-4 sm:px-0">
            <div class="sm:hidden">
              <label for="question-tabs" class="sr-only">Select a tab</label>
              <select
                id="question-tabs"
                class="block w-full rounded-md border-slate-300
                text-base font-medium text-slate-900 shadow-sm
                focus:border-blue-500 focus:ring-blue-500"
              >
                <option
                  v-for="tab in tabs"
                  :key="tab.name"
                  :selected="tab.current"
                >
                  {{ tab.name }}
                </option>
              </select>
            </div>
            <div class="hidden sm:block">
              <nav
                class="isolate flex divide-x divide-slate-200 rounded-lg shadow"
                aria-label="Tabs"
              >
                <a
                  v-for="(tab, tabIdx) in tabs"
                  :key="tab.name"
                  :href="tab.href"
                  :aria-current="tab.current ? 'page' : undefined"
                  :class="[
                    tab.current
                      ? 'text-slate-900'
                      : 'text-slate-500 hover:text-slate-700',
                    tabIdx === 0
                      ? 'rounded-l-lg'
                      : '',
                    tabIdx === tabs.length - 1
                      ? 'rounded-r-lg'
                      : '',
                    'group relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-6',
                    'text-sm font-medium text-center hover:bg-slate-50 focus:z-10'
                  ]"
                >
                  <span>{{ tab.name }}</span>
                  <span
                    aria-hidden="true"
                    :class="[
                      tab.current
                        ? 'bg-blue-500'
                        : 'bg-transparent',
                      'absolute inset-x-0 bottom-0 h-0.5'
                    ]"
                  />
                </a>
              </nav>
            </div>
          </div>

          <!-- questions -->
          <div class="mt-4">
            <h1 class="sr-only">
              Recent questions
            </h1>
            <ul role="list" class="space-y-4">
              <li
                v-for="question in questions"
                :key="question.id"
                class="bg-white px-4 py-6 shadow sm:rounded-lg sm:p-6"
              >
                <article :aria-labelledby="'question-title-' + question.id" />
              </li>
            </ul>
          </div>
        </main>

        <aside class="hidden xl:col-span-4 xl:block">
          <div class="sticky top-4 space-y-4">
            <!-- sections -->
            <section aria-labelledby="who-to-follow-heading">
              <div class="rounded-lg bg-white shadow">
                <div class="p-6">
                  <h2
                    id="who-to-follow-heading"
                    class="text-base font-medium text-slate-900"
                  >
                    Who to follow
                  </h2>

                  <div class="mt-6 flow-root" />

                  <div class="mt-6">
                    <a
                      href="#"
                      class="block w-full rounded-md border border-slate-300 bg-white
                      px-4 py-2 text-center text-sm font-medium text-slate-700 shadow-sm
                      hover:bg-slate-50"
                    >
                      View all
                    </a>
                  </div>
                </div>
              </div>
            </section>
            <section aria-labelledby="trending-heading" />
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script>
import {
  Popover as PopoverContainer,
  PopoverButton,

  Menu as MenuContainer,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/vue';
import {
  MagnifyingGlassIcon,
} from '@heroicons/vue/20/solid';
import {
  Bars3Icon,
  BellIcon,
  BuildingOffice2Icon,
  HomeIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

export default {
  name: 'ManagePage',

  components: {
    Bars3Icon,
    BellIcon,
    MagnifyingGlassIcon,

    MenuButton,
    MenuContainer,
    MenuItem,
    MenuItems,

    PopoverButton,
    PopoverContainer,
    XMarkIcon,
  },

  data: () => ({
    user: {
      name: 'Chelsea Hagon',
      email: 'chelsea.hagon@example.com',
      imageUrl:
        'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },

    communities: [
      { name: 'Movies', href: '#' },
      { name: 'Food', href: '#' },
      { name: 'Sports', href: '#' },
      { name: 'Animals', href: '#' },
      { name: 'Science', href: '#' },
      { name: 'Dinosaurs', href: '#' },
      { name: 'Talents', href: '#' },
      { name: 'Gaming', href: '#' },
    ],

    userNavigation: [
      { name: 'Your Profile', href: '#' },
      { name: 'Settings', href: '#' },
      { name: 'Sign out', href: '#' },
    ],

    primaryNavItems: [{
      name: 'Dashboard',
      to: '#',
      current: true,
      icon: HomeIcon,
    }, {
      name: 'Profile',
      to: '#',
      icon: UserCircleIcon,
    }, {
      name: 'Organizations',
      to: '#',
      icon: BuildingOffice2Icon,
    }],

    tabs: [
      { name: 'Recent', href: '#', current: true },
      { name: 'Most Liked', href: '#', current: false },
      { name: 'Most Answers', href: '#', current: false },
    ],

    questions: [
      {
        id: '81614',
        likes: '29',
        replies: '11',
        views: '2.7k',
        author: {
          name: 'Dries Vincent',
          imageUrl:
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          href: '#',
        },
        date: 'December 9 at 11:43 AM',
        datetime: '2020-12-09T11:43:00',
        href: '#',
        title: 'What would you have done differently if you ran Jurassic Park?',
        body: `
          <p>Jurassic Park was an incredible idea and a magnificent feat of engineering, but poor protocols and a disregard for human safety killed what could have otherwise been one of the best businesses of our generation.</p>
          <p>Ultimately, I think that if you wanted to run the park successfully and keep visitors safe, the most important thing to prioritize would be&hellip;</p>
        `,
      },
      // More questions...
    ],
  }),
};
</script>
