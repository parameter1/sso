import { TOKEN_KEY, AuthToken } from './auth-token';
import parseJSON from './parse-json';

export default async function loadIframe({ origin }) {
  const id = 'p1-sso-ipc';
  const el = document.getElementById(id);
  if (el) return el;
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.onerror = reject;
    iframe.src = `${origin}/app/ipc.html?t=${Date.now()}`;
    iframe.style.display = 'none';

    window.addEventListener('message', (event) => {
      if (event.origin !== origin) return;
      const message = parseJSON(event.data);
      if (!message || message.key !== TOKEN_KEY || message.action !== 'init') return;
      const { value } = message;
      if (value) {
        AuthToken.set(value);
      } else {
        AuthToken.remove();
      }
      resolve(iframe);
    }, false);

    document.body.appendChild(iframe);
  });
}
