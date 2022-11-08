<template>
  <div class="text-sm">
    <a
      href="#"
      class="font-medium text-blue-600
      hover:underline hover:decoration-slate-500
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
      focus:rounded-sm"
    >
      {{ label }}
    </a>
  </div>
</template>

<script>
export default {
  name: 'LoginNeedAccess',

  props: {
    label: {
      type: String,
      default: 'Need access?',
    },
  },
};
</script>
