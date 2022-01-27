import parseJSON from './parse-json';

const attachMessageListener = ({ origin, next = window.location.href } = {}) => window.addEventListener('message', (event) => {
  if (event.origin !== origin) return;
  const message = parseJSON(event.data);
  if (!message || message.cat !== 'p1-sso-token') return;
  const { act } = message;

  if (act === 'add') {
    window.location.reload();
    return;
  }

  if (act === 'remove') {
    const href = `${origin}/app/login?next=${encodeURIComponent(next)}`;
    window.location.href = href;
  }
}, false);

const appendFrame = ({ origin } = {}) => {
  const iframe = document.createElement('iframe');
  iframe.src = `${origin}/app/ipc.html?t=${Date.now()}`;
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
};

const init = ({ origin, next }) => {
  attachMessageListener({ origin, next });
  appendFrame({ origin });
};

export default {
  init,
};
