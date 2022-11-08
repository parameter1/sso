<template>
  <div class="flex min-h-full">
    <div
      class="flex flex-1 flex-col justify-center py-12 px-4
      sm:px-6 lg:flex-none lg:px-20 xl:px-24 shadow-lg shadow-blue-800
      "
    >
      <div class="mx-auto w-full max-w-sm lg:w-96">
        <div class="mb-8">
          <img
            class="h-12 w-auto"
            src="https://img.parameter1.com/www/p1-logo-glass-vinyl.svg"
            alt="Parameter1"
          >
          <h2 class="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            <span v-if="sent">
              Check your email
            </span>
            <span v-else>
              Sign in to access your apps
            </span>
          </h2>
        </div>

        <div>
          <div class="relative mt-6">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
              <div class="w-full border-t border-slate-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="bg-white px-2 text-slate-500">
                <span v-if="sent">
                  A login link was created
                </span>
                <span v-else>
                  A login link will be emailed to you
                </span>
              </span>
            </div>
          </div>

          <div v-if="sent" class="mt-6 py-px">
            <p class="text-base text-slate-700">
              We just sent an email to
              <span class="font-medium text-slate-900">jacob@parameter1.com</span>
              with your one-time login link.
              To finish signing in, open the email message and click the link within.
            </p>

            <need-access label="Need help?" class="mt-3" />

            <continue-button
              class="mt-8"
              label="Start over"
              @click="sent = null"
            />
          </div>

          <div v-else class="mt-8">
            <form class="space-y-6" @submit.prevent="sendLoginLink">
              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <div class="mt-1">
                  <email-input v-model="email" :disabled="sending" />
                </div>
              </div>

              <div class="flex items-center justify-between">
                <remember-me v-model="rememberMe" :disabled="sending" />
                <need-access />
              </div>

              <div>
                <continue-button :loading="sending" />
              </div>

              <error-element
                class="mt-4"
                header="There was a problem signing in"
                :error="error"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
    <div class="relative hidden w-0 flex-1 lg:block">
      <img
        class="absolute inset-0 h-full w-full object-cover opacity-70"
        src="https://images.unsplash.com/photo-1497604401993-f2e922e5cb0a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
        alt=""
      >
    </div>
  </div>
</template>

<script>
import ErrorElement from '../components/error.vue';

import ContinueButton from '../components/login/continue-button.vue';
import EmailInput from '../components/login/email-input.vue';
import NeedAccess from '../components/login/need-access.vue';
import RememberMe from '../components/login/remember-me.vue';

import userService from '../services/user';
import GraphQLError from '../graphql/error';

const REMEMBER_ME_KEY = 'login-remember-me';

export default {
  name: 'LoginPage',

  components: {
    ContinueButton,
    EmailInput,
    ErrorElement,
    NeedAccess,
    RememberMe,
  },

  props: {
    next: {
      type: String,
      default: null,
    },
  },

  data: () => ({
    email: localStorage.getItem(REMEMBER_ME_KEY) || null,
    error: null,
    rememberMe: Boolean(localStorage.getItem(REMEMBER_ME_KEY)),
    sending: false,
    sent: false,
  }),

  watch: {
    rememberMe(value) {
      if (!value) localStorage.removeItem(REMEMBER_ME_KEY);
    },
  },

  methods: {
    async sendLoginLink() {
      try {
        this.error = null;
        this.sending = true;
        await userService.sendUserLoginLink({ email: this.email, next: this.next });
        if (this.rememberMe) localStorage.setItem(REMEMBER_ME_KEY, this.email);
        this.sent = true;
      } catch (e) {
        this.error = new GraphQLError(e);
      } finally {
        this.sending = false;
      }
    },
  },
};
</script>
