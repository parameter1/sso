<template>
  <main>
    <h1>Login</h1>

    <section>
      <form v-if="!linkWasSent" @submit.prevent="sendLoginLink">
        <fieldset :disabled="isSendingLink">
          <user-email-field v-model="email" />

          <button-element :loading="isSendingLink" type="submit">
            Send Link
          </button-element>
        </fieldset>

        <error-element :error="error.loginLink" />
      </form>

      <div v-else>
        A personal login link was emailed to {{ email }}
      </div>
    </section>
  </main>
</template>

<script>
import ErrorElement from '../components/error.vue';
import ButtonElement from '../components/button.vue';
import UserEmailField from '../components/fields/user/email.vue';

import userService from '../services/user';
import GraphQLError from '../graphql/error';

export default {
  name: 'LoginPage',

  components: {
    ButtonElement,
    ErrorElement,
    UserEmailField,
  },

  props: {
    next: {
      type: String,
      default: null,
    },
  },

  data: () => ({
    email: null,
    error: { loginLink: null },
    isSendingLink: false,
    linkWasSent: false,
  }),

  methods: {
    async sendLoginLink() {
      try {
        this.error.loginLink = null;
        this.isSendingLink = true;
        await userService.sendUserLoginLink({
          email: this.email,
          next: this.next,
        });
        this.linkWasSent = true;
      } catch (e) {
        this.error.loginLink = new GraphQLError(e);
      } finally {
        this.isSendingLink = false;
      }
    },
  },
};
</script>
