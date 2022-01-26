import cookie from 'js-cookie';
import constants from '../constants';

const { TOKEN_KEY } = constants;

const setCookie = (value) => cookie.set(TOKEN_KEY, value, { expires: 86400 });

const get = () => {
  const storageValue = localStorage.getItem(TOKEN_KEY);
  const cookieValue = cookie.get(TOKEN_KEY);

  // restore cookie if missing and storage value is present
  if (!cookieValue && storageValue) setCookie(storageValue);
  // remove cookie if present but storage value is missing
  if (cookieValue && !storageValue) cookie.remove(TOKEN_KEY);
  return storageValue;
};

export default {
  get,
  exists: () => Boolean(get()),
  remove: () => {
    localStorage.removeItem(TOKEN_KEY);
    cookie.remove(TOKEN_KEY);
  },
  set: (value) => {
    if (!value) throw new Error('Unable to set auth token: no value was provided.');
    localStorage.setItem(TOKEN_KEY, value);
    setCookie(value);
  },
};
