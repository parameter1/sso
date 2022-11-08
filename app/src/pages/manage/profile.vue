<template>
  <section>
    <h2>User Profile</h2>

    <p v-if="isLoading">
      Loading...
    </p>

    <error-element v-else-if="loadError" :error="loadError" />

    <form v-else @submit.prevent="saveProfile">
      <fieldset :disabled="isSaving">
        <user-given-name-field v-model="currentUser.name.given" />
        <user-family-name-field v-model="currentUser.name.family" />

        <button-element :loading="isSaving" type="submit">
          Save
        </button-element>
      </fieldset>

      <error-element :error="saveError" />

      <p v-if="saveMessage">
        {{ saveMessage }}
      </p>
    </form>
  </section>
</template>

<script>
import gql from 'graphql-tag';
import clone from 'lodash.clonedeep';
import ButtonElement from '../../components/button.vue';
import ErrorElement from '../../components/error.vue';
import UserFamilyNameField from '../../components/fields/user/family-name.vue';
import UserGivenNameField from '../../components/fields/user/given-name.vue';

import { CURRENT_USER } from '../../graphql/queries';
import { UPDATE_OWN_USER_NAMES } from '../../graphql/mutations';
import GraphQLError from '../../graphql/error';

export default {
  name: 'ManageProfilePage',

  components: {
    ButtonElement,
    ErrorElement,
    UserFamilyNameField,
    UserGivenNameField,
  },

  apollo: {
    currentUser: {
      query: CURRENT_USER,
      fetchPolicy: 'cache-and-network',
      update({ currentUser }) {
        return clone(currentUser);
      },
      error(e) { this.loadError = new GraphQLError(e); },
      watchLoading(isLoading) {
        this.isLoading = isLoading;
        if (isLoading) this.loadError = null;
      },
    },

    $subscribe: {
      ownUserEventProcessed: {
        client: 'subscription',
        query: gql`
          subscription ManageProfilePage {
            event: currentUserCommandProcessed(input: {
              for: [{ entityType: USER commands: ["CHANGE_NAME"] }]
            }) {
              _id
            }
          }
        `,
        result({ data }) {
          if (data.event._id === this.lastEventId) {
            // @todo silently reload the user data.
            this.saveMessage = 'Profile update successfully processed.';
          }
        },
      },
    },
  },

  data: () => ({
    currentUser: {
      email: {},
      name: {},
    },
    isLoading: false,
    isSaving: false,
    lastEventId: null,
    loadError: null,
    saveError: null,
    saveMessage: null,
  }),

  methods: {
    async saveProfile() {
      try {
        this.saveMessage = null;
        this.saveError = null;
        this.isSaving = true;
        const { given, family } = this.currentUser.name;
        const input = { given, family };

        const client = this.$apollo.provider.clients.command;
        const { data } = await client.mutate({
          mutation: UPDATE_OWN_USER_NAMES,
          variables: { input },
        });
        const [event] = data.ownUserNames;
        this.lastEventId = event._id;
        this.saveMessage = 'Profile update command successfully submitted.';
      } catch (e) {
        this.saveError = new GraphQLError(e);
      } finally {
        this.isSaving = false;
      }
    },
  },
};
</script>
