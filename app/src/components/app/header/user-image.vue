<template>
  <img
    v-if="src"
    class="h-10 w-10 rounded-full"
    :src="src"
    :srcset="srcset"
    :alt="alt"
  >
  <div v-else>
    <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
      <span class="font-medium leading-none text-white">
        {{ initials }}
      </span>
    </span>
  </div>
</template>

<script>
export default {
  name: 'AppHeaderUserImage',

  props: {
    initials: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    src: {
      type: String,
      default: null,
    },

    srcset: {
      type: String,
      default: null,
    },
  },

  computed: {
    alt() {
      return `${this.name} Profile Image`;
    },
  },
};
</script>
