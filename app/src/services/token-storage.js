import cookie from 'js-cookie';
import constants from '../constants';

const { TOKEN_KEY } = constants;

const parse = (json) => {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

const setCookie = (value) => cookie.set(TOKEN_KEY, value, { expires: 86400 });

const get = () => {
  const storageValue = parse(localStorage.getItem(TOKEN_KEY));
  const cookieValue = parse(cookie.get(TOKEN_KEY));

  // restore cookie if missing and storage value is present
  if (!cookieValue && storageValue) setCookie(JSON.stringify(storageValue));
  // remove cookie if present but storage value is missing
  if (cookieValue && !storageValue) cookie.remove(TOKEN_KEY);
  return storageValue;
};

export default {
  get,
  exists: () => {
    const tokenObj = get();
    return Boolean(tokenObj && tokenObj.value);
  },
  remove: () => {
    localStorage.removeItem(TOKEN_KEY);
    cookie.remove(TOKEN_KEY);
  },
  set: (obj) => {
    if (!obj || !obj.value) throw new Error('Unable to set token: no value was provided.');
    const json = JSON.stringify(obj);
    localStorage.setItem(TOKEN_KEY, json);
    setCookie(json);
  },
};
