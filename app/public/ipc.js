const parseJSON = (json) => {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

const sendMessage = ({ key, action, value }) => {
  const message = { key, action, value };
  // @todo must find a way to whitelist the message domains!
  window.parent.postMessage(JSON.stringify(message), '*');
};

const keys = {
  token: '__p1-sso-token',
};

const init = () => {
  const { token: key } = keys;
  const value = parseJSON(localStorage.getItem(key));
  sendMessage({ key, action: 'init', value });
};

const sendAdd = (value) => {
  const { token: key } = keys;
  sendMessage({ key, action: 'add', value });
};

const sendRemove = () => {
  const { token: key } = keys;
  sendMessage({ key, action: 'remove' });
};

init();

window.addEventListener('message', (event) => {
  // @todo need to determine app URLs that can send this
  const message = parseJSON(event.data);
  if (!message || message.key !== keys.token) return;

  if (message.action === 'remove') {
    // remove application has requested a user logout. remove the token from storage.
    localStorage.removeItem(keys.token);
  }
});

window.addEventListener('storage', (event) => {
  const { key, newValue } = event;
  // if key is null, all of local storage was cleared. signal a token removal.
  if (key === null) {
    sendRemove();
    return;
  }
  // only act on the token key...
  if (key === keys.token) {
    // if a new value is set. singal the token addition if parsable
    if (newValue) {
      const parsed = parseJSON(newValue);
      if (parsed) {
        sendAdd(parsed);
      }
      return;
    }
    // otherwise treat as a clear/logout
    sendRemove();
  }
});
