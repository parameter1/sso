import { createApp } from 'vue';
import App from './app.vue';
import router from './routes';

const app = createApp(App);
app.use(router);
app.mount('#app');
