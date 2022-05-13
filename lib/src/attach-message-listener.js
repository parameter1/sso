import { TOKEN_KEY, AuthToken } from './auth-token';
import parseJSON from './parse-json';

export default function attachMessageListener({ origin, next = window.location.href } = {}) {
  window.addEventListener('message', (event) => {
    if (event.origin !== origin) return;
    const message = parseJSON(event.data);
    if (!message || message.key !== TOKEN_KEY) return;
    const { action, value } = message;

    if (action === 'add') {
      AuthToken.set(value);
      window.location.reload();
      return;
    }

    if (action === 'remove') {
      const href = `${origin}/app/login?next=${encodeURIComponent(next)}`;
      AuthToken.remove();
      window.location.href = href;
    }
  }, false);
}
