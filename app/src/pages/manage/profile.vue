<template>
  <section>
    <h2>User Profile</h2>

    <p v-if="isLoading">
      Loading...
    </p>

    <error-element v-else-if="loadError" :error="loadError" />

    <form v-else @submit.prevent="saveProfile">
      <fieldset :disabled="isSaving">
        <user-given-name-field v-model="currentUser.givenName" />
        <user-family-name-field v-model="currentUser.familyName" />

        <button-element :loading="isSaving" type="submit">
          Save
        </button-element>
      </fieldset>

      <error-element :error="saveError" />
    </form>
  </section>
</template>

<script>
import clone from 'lodash.clonedeep';
import ButtonElement from '../../components/button.vue';
import ErrorElement from '../../components/error.vue';
import UserFamilyNameField from '../../components/fields/user/family-name.vue';
import UserGivenNameField from '../../components/fields/user/given-name.vue';

import { CURRENT_USER } from '../../graphql/queries';
import { UPDATE_OWN_USER_PROFILE } from '../../graphql/mutations';
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
  },

  data: () => ({
    currentUser: {},
    isLoading: false,
    isSaving: false,
    loadError: null,
    saveError: null,
  }),

  methods: {
    async saveProfile() {
      try {
        this.saveError = null;
        this.isSaving = true;
        const { givenName, familyName } = this.currentUser;
        const input = { givenName, familyName };
        await this.$apollo.mutate({
          mutation: UPDATE_OWN_USER_PROFILE,
          variables: { input },
        });
      } catch (e) {
        this.saveError = new GraphQLError(e);
      } finally {
        this.isSaving = false;
      }
    },
  },
};
</script>
