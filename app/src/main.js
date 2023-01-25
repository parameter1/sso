import { createApp } from 'vue';
import { createApolloProvider } from '@vue/apollo-option';
import App from './app.vue';
import router from './routes';
import clients from './apollo';
import './index.css';

const apolloProvider = createApolloProvider({
  clients,
  defaultClient: clients.query,
});

const app = createApp(App);
app.use(apolloProvider);
app.use(router);
app.mount('#app');
