<template>
  <div class="p1-sso-ipc" style="display: none;" />
</template>

<script>
import addTokenListener from '../services/add-token-listener';

export default {
  name: 'IPCPage',

  created() {
    addTokenListener({
      onAdd: () => {
        // emit token added message
        this.send({ act: 'add' });
      },
      onRemove: () => {
        // emit token added message
        this.send({ act: 'remove' });
      },
    });
  },

  methods: {
    send({ act } = {}) {
      const message = { cat: 'p1-sso-token', act };
      window.parent.postMessage(JSON.stringify(message), '*');
    },
  },
};
</script>
