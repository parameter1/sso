import { TOKEN_KEY } from './auth-token';
import parseJSON from './parse-json';

export default function attachMessageListener({
  onTokenAdd,
  onTokenRemove,
  origin,
} = {}) {
  window.addEventListener('message', (event) => {
    if (event.origin !== origin) return;
    const message = parseJSON(event.data);
    if (!message || message.key !== TOKEN_KEY) return;
    const { action, value } = message;

    if (action === 'add') {
      onTokenAdd(value);
      return;
    }

    if (action === 'remove') {
      onTokenRemove();
    }
  }, false);
}
