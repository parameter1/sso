import { TOKEN_KEY, AuthToken } from './auth-token';
import parseJSON from './parse-json';

const testResource = async (src) => {
  try {
    const res = await fetch(src, { method: 'GET', credentials: 'omit' });
    if (!res.ok) throw new Error(`Received an invalid response code ${res.status}`);
  } catch (e) {
    const err = new Error(`Unable to load SSO iframe src ${src}`);
    err.originalError = e;
    throw err;
  }
};

export default async function loadIframe({ origin }) {
  const id = 'p1-sso-ipc';
  const el = document.getElementById(id);
  if (el) return el;

  const src = `${origin}/ipc.html?t=${Date.now()}`;

  // first, ensure the iframe src can be retrieved.
  // the iframe `onerror` hook will not be fired on 404s or bad network connections, etc.
  await testResource(src);

  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.onerror = reject;
    iframe.src = src;
    iframe.style.border = 'none';
    iframe.style.display = 'none';

    window.addEventListener('message', (event) => {
      if (event.origin !== origin) return;
      const message = parseJSON(event.data);
      if (!message || message.key !== TOKEN_KEY) return;
      const { action, value } = message;

      if (action === 'storage-access-status') {
        if (value === false) {
          iframe.style.display = 'block';
        } else {
          iframe.style.display = 'none';
        }
      }

      if (action === 'init') {
        if (value) {
          AuthToken.set(value);
        } else {
          AuthToken.remove();
        }
        resolve(iframe);
      }
    }, false);
    document.body.appendChild(iframe);
  });
}
