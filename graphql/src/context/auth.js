import Errors from '../utils/errors.js';
import repos from '../repos.js';

const requiredUserFields = ['name'];
const requiredUserFieldProjection = requiredUserFields
  .reduce((o, field) => ({ ...o, [field]: 1 }), {});

const parseHeader = (header) => {
  if (!header) return {};
  const [type, value] = header.trim().replace(/\s\s+/, ' ').split(' ');
  return { type, value };
};

export default function AuthContext({ header } = {}) {
  let authToken;
  let error;
  let promise;
  let user;

  const load = async () => {
    if (!promise) {
      promise = (async () => {
        if (!header) return;
        const { type, value } = parseHeader(header);
        if (type !== 'Bearer') throw Errors.notAuthenticated(`The auth type '${type}' is not supported.`);
        if (!value) return;
        authToken = value;
        user = await repos.$('user').verifyAuthToken({
          authToken,
          projection: { email: 1, ...requiredUserFieldProjection },
        });
      })();
    }
    try {
      await promise;
    } catch (e) {
      error = e;
    }
  };

  const check = async () => {
    await load();
    if (error) throw Errors.notAuthenticated(error.message);
    if (!user) throw Errors.notAuthenticated('You must be logged-in to access this resource.');
    return true;
  };

  const getAuthToken = async () => {
    await check();
    return authToken;
  };

  const getUser = async () => {
    await check();
    return user;
  };

  const getUserId = async () => {
    const u = await getUser();
    return u._id;
  };

  const isAuthenticated = async () => {
    try {
      await check();
      return true;
    } catch (e) {
      return false;
    }
  };

  const checkIsCurrentUser = async (id, message = 'You do not have the proper permissions to perform this operation.') => {
    if (!id) throw new Error('A user ID is required in order to check if the current user matches');
    const currentUserId = await getUserId();
    if (`${currentUserId}` !== `${id}`) throw Errors.forbidden(message);
    return true;
  };

  return {
    check,
    checkIsCurrentUser,
    getAuthToken,
    getUser,
    getUserId,
    isAuthenticated,
  };
}
