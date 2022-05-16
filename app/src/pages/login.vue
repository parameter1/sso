<template>
  <main>
    <h1>Login</h1>

    <section v-if="isLoadingApp">
      Loading...
    </section>

    <error-element v-else-if="error.app" :error="error.app" />

    <section v-else>
      <h2 v-if="subHeading">
        {{ subHeading }}
      </h2>
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
import gql from 'graphql-tag';

import ErrorElement from '../components/error.vue';
import ButtonElement from '../components/button.vue';
import UserEmailField from '../components/fields/user/email.vue';

import userService from '../services/user';
import GraphQLError from '../graphql/error';

const QUERY = gql`
  query LoginApplication($input: QueryApplicationByKeyInput!) {
    application: applicationByKey(input: $input) { _id name }
  }
`;

export default {
  name: 'LoginPage',

  components: {
    ButtonElement,
    ErrorElement,
    UserEmailField,
  },

  apollo: {
    application: {
      query: QUERY,
      fetchPolicy: 'cache-and-network',
      skip() {
        return !this.appKey || !this.next;
      },
      variables() {
        const input = { key: this.appKey };
        return { input };
      },
      error(e) { this.error.app = new GraphQLError(e); },
      watchLoading(isLoading) {
        this.isLoadingApp = isLoading;
        if (isLoading) this.error.app = null;
      },
    },
  },

  props: {
    appKey: {
      type: String,
      default: null,
    },
    next: {
      type: String,
      default: null,
    },
  },

  data: () => ({
    application: {},
    email: null,
    error: { app: null, loginLink: null },
    isLoadingApp: false,
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
          appKey: this.appKey,
        });
        this.linkWasSent = true;
      } catch (e) {
        this.error.loginLink = new GraphQLError(e);
      } finally {
        this.isSendingLink = false;
      }
    },
  },

  computed: {
    subHeading() {
      if (!this.next || !this.application.name) return null;
      return this.application.name;
    },
  },
};
</script>
