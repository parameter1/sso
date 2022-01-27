import constants from '../constants';

const { TOKEN_KEY } = constants;

export default function addTokenListener({ onAdd, onRemove } = {}) {
  return window.addEventListener('storage', (event) => {
    const { key, newValue } = event;
    // if key is null, all of local storage was cleared. user should be logged out
    if (key === null) {
      onRemove({ value: null, event });
      return;
    }
    // only act on the token key...
    if (key === TOKEN_KEY) {
      // if a new value is set. this effectively logs the user in.
      if (newValue) {
        onAdd({ value: newValue, event });
        return;
      }
      // otherwise treat as a clear/logout
      onRemove({ value: null, event });
    }
  });
}
