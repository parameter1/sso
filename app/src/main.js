import { createApp } from 'vue';
import { createApolloProvider } from '@vue/apollo-option';
import App from './app.vue';
import router from './routes';
import apolloClient from './apollo';
import userService from './services/user';

const apolloProvider = createApolloProvider({ defaultClient: apolloClient });

userService.attachStorageListener();

const app = createApp(App);
app.use(apolloProvider);
app.use(router);
app.mount('#app');
