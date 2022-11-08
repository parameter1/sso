<template>
  <div class="text-sm">
    <a
      href="#help"
      class="font-medium text-blue-600
      hover:underline hover:decoration-slate-500
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
      focus:rounded-sm"
      @click.prevent="$emit('click')"
    >
      <slot>
        Need help?
      </slot>
    </a>
  </div>
</template>

<script>
export default {
  name: 'LoginHelpLink',

  emits: ['click'],
};
</script>
