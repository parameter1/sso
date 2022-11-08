<template>
  <splash-image-layout>
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
            We just sent an email to with your one-time login link.
            To finish signing in, open the email message and click the link within.
          </p>

          <div class="flex items-center justify-between mt-3">
            <p class="text-sm">
              <span class="text-slate-700">
                Sent to
              </span>
              <span class="font-medium text-slate-900">
                {{ email }}
              </span>
            </p>
            <help-link @click="helpOpen = true" />
          </div>

          <login-button class="mt-8" @click="startOver">
            Start over
          </login-button>
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
                <email-input
                  v-model="email"
                  :disabled="sending"
                  :autofocus="autofocus.email"
                />
              </div>
            </div>

            <div class="flex items-center justify-between">
              <remember-me v-model="rememberMe" :disabled="sending" />
              <help-link @click="helpOpen = true" />
            </div>

            <div>
              <login-button :loading="sending" :autofocus="autofocus.button">
                Continue
              </login-button>
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

    <modal-overlay
      :open="helpOpen"
      backdrop
      @close="helpOpen = false"
    >
      <help-panel />
    </modal-overlay>
  </splash-image-layout>
</template>

<script>
import EmailInput from '../components/login/email-input.vue';
import ErrorElement from '../components/error.vue';
import HelpLink from '../components/login/help-link.vue';
import HelpPanel from '../components/login/help-panel.vue';
import LoginButton from '../components/login/button.vue';
import ModalOverlay from '../components/overlays/modal.vue';
import RememberMe from '../components/login/remember-me.vue';
import SplashImageLayout from '../components/layouts/splash-image.vue';

import userService from '../services/user';
import GraphQLError from '../graphql/error';

const REMEMBER_ME_KEY = 'login-remember-me';

export default {
  name: 'LoginPage',

  components: {
    EmailInput,
    ErrorElement,
    HelpLink,
    HelpPanel,
    LoginButton,
    ModalOverlay,
    RememberMe,
    SplashImageLayout,
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
    helpOpen: false,
    rememberMe: Boolean(localStorage.getItem(REMEMBER_ME_KEY)),
    sending: false,
    sent: false,
  }),

  watch: {
    rememberMe(value) {
      if (!value) localStorage.removeItem(REMEMBER_ME_KEY);
    },
  },

  computed: {
    autofocus() {
      if (!this.email) return { email: true };
      if (this.rememberMe && this.email) return { button: true };
      return {};
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

    startOver() {
      if (!this.rememberMe) this.email = null;
      this.sent = null;
    },
  },
};
</script>
