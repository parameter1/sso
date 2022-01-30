import parseJSON from './parse-json';

const TOKEN_KEY = '__p1-sso-token';

const setToken = (value) => {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(value));
};

const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const attachMessageListener = ({ origin, next = window.location.href } = {}) => window.addEventListener('message', (event) => {
  if (event.origin !== origin) return;
  const message = parseJSON(event.data);
  if (!message || message.key !== TOKEN_KEY) return;
  const { action, value } = message;

  if (action === 'add') {
    setToken(value);
    window.location.reload();
    return;
  }

  if (action === 'remove') {
    const href = `${origin}/app/login?next=${encodeURIComponent(next)}`;
    removeToken();
    window.location.href = href;
  }
}, false);

const loadFrame = ({ origin } = {}) => new Promise((resolve, reject) => {
  const iframe = document.createElement('iframe');
  iframe.onerror = reject;

  iframe.src = `${origin}/app/ipc.html?t=${Date.now()}`;
  iframe.style.display = 'none';

  window.addEventListener('message', (event) => {
    if (event.origin !== origin) return;
    const message = parseJSON(event.data);
    if (!message || message.key !== TOKEN_KEY || message.action !== 'init') return;
    const { value } = message;
    if (value) {
      setToken(value);
    } else {
      removeToken();
    }
    resolve();
  }, false);

  document.body.appendChild(iframe);
});

const init = async ({
  origin = 'https://sso.parameter1.com',
  next,
}) => {
  await loadFrame({ origin });
  attachMessageListener({ origin, next });
};

export default {
  init,
};
