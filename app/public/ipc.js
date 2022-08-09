export const TOKEN_KEY = '__p1-sso-token';

function parseJSON(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

class AuthToken {
  static exists() {
    return Boolean(AuthToken.get());
  }

  static get() {
    return parseJSON(localStorage.getItem(TOKEN_KEY));
  }

  static getKey() {
    return TOKEN_KEY;
  }

  static remove() {
    localStorage.removeItem(TOKEN_KEY);
  }

  static set(value) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(value));
  }
}

export function sendMessageToParent(action, payload = {}) {
  const message = {
    ...payload,
    key: TOKEN_KEY,
    action,
  };
  // @todo must find a way to whitelist the message domains!
  window.parent.postMessage(JSON.stringify(message), '*');
}

const sendTokenChange = (value) => {
  sendMessageToParent('token-change', { value });
};

const attachMessageListener = () => window.addEventListener('message', (event) => {
  // @todo need to determine app URLs that can send this
  const message = parseJSON(event.data);
  if (!message || message.key !== TOKEN_KEY) return;
  if (message.action === 'remove') {
    // application has requested a user logout. remove the token from storage.
    AuthToken.remove();
  }
});

const attachStorageListener = () => window.addEventListener('storage', (event) => {
  const { key, newValue } = event;
  // if key is null, all of local storage was cleared. signal a token removal.
  if (key === null) {
    sendTokenChange(null);
    return;
  }
  // only act on the token key...
  if (key === TOKEN_KEY) {
    // if a new value is set. singal the token addition if parsable
    if (newValue) {
      const parsed = parseJSON(newValue);
      if (parsed) {
        sendTokenChange(parsed);
      }
      return;
    }
    // otherwise treat as a clear/logout
    sendTokenChange(null);
  }
});

export async function getStorageAccessStatus() {
  if (typeof document.hasStorageAccess !== 'function') return true;
  const hasAccess = await document.hasStorageAccess();
  return hasAccess;
}

export async function init() {
  const authToken = AuthToken.get();
  attachStorageListener();
  attachMessageListener();
  sendMessageToParent('init', { value: authToken });
}
