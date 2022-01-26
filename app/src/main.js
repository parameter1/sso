import { createApp } from 'vue';
import { createApolloProvider } from '@vue/apollo-option';
import App from './app.vue';
import router from './routes';
import apolloClient from './apollo';

const apolloProvider = createApolloProvider({ defaultClient: apolloClient });

const app = createApp(App);
app.use(apolloProvider);
app.use(router);
app.mount('#app');
