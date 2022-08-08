import constants from '../constants';

const { TOKEN_KEY } = constants;

const parse = (json) => {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

const get = () => parse(localStorage.getItem(TOKEN_KEY));

export default {
  get,
  exists: () => {
    const tokenObj = get();
    return Boolean(tokenObj && tokenObj.value);
  },
  remove: () => {
    localStorage.removeItem(TOKEN_KEY);
  },
  set: (obj) => {
    if (!obj || !obj.value) throw new Error('Unable to set token: no value was provided.');
    const json = JSON.stringify(obj);
    localStorage.setItem(TOKEN_KEY, json);
  },
};
