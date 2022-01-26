<template>
  <main>
    <section>
      <h1>Alerts</h1>

      <alert-element header="This is a header">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc a commodo erat.
      </alert-element>

      <hr>
    </section>

    <section>
      <h1>Errors</h1>

      <error-element :error="error" />
      <hr>
    </section>

    <section>
      <h1>Buttons</h1>

      <div class="mb">
        <button-element>
          Submit
        </button-element>
      </div>
      <div class="mb">
        <button-element :disabled="true">
          Submit
        </button-element>
      </div>
      <div class="mb">
        <button-element :loading="true">
          Submit
        </button-element>
      </div>
      <hr>
    </section>
  </main>
</template>

<script>
import AlertElement from '../components/alert.vue';
import ButtonElement from '../components/button.vue';
import ErrorElement from '../components/error.vue';

export default {
  name: 'StyleGuidePage',

  components: {
    AlertElement,
    ButtonElement,
    ErrorElement,
  },

  data: () => ({
    error: new Error('A fatal error occured'),
  }),
};
</script>

<style>
.mb {
  margin-bottom: 1rem;
}
</style>
