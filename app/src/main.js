import { createApp } from 'vue';
import { createApolloProvider } from '@vue/apollo-option';
import App from './app.vue';
import router from './routes';
import clients from './apollo';
import userService from './services/user';

const apolloProvider = createApolloProvider({
  clients,
  defaultClient: clients.query,
});

userService.attachStorageListener();

const app = createApp(App);
app.use(apolloProvider);
app.use(router);
app.mount('#app');
