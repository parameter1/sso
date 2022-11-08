<template>
  <div v-if="error" class="rounded-md bg-red-50 p-4 border border-red-200/60" role="alert">
    <div class="flex">
      <div class="flex-shrink-0">
        <x-circle-icon class="h-5 w-5 text-red-400" aria-hidden="true" />
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-red-800">
          {{ header }}
        </h3>
        <div class="mt-2 text-sm text-red-700">
          <ul role="list" class="list-disc space-y-1 pl-5">
            <li>{{ error.message }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { XCircleIcon } from '@heroicons/vue/20/solid';

export default {
  name: 'ErrorAlert',

  components: {
    XCircleIcon,
  },

  props: {
    error: {
      type: Error,
      default: null,
    },

    header: {
      type: String,
      default: 'An error was encountered',
    },
  },
};
</script>
