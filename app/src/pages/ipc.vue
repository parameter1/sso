<template>
  <h1>IPC</h1>
  <div class="p1-sso-ipc" style="display: none;" />
</template>

<script>
import userService from '../services/user';

export default {
  name: 'IPCPage',

  created() {
    userService.addTokenListener({
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
