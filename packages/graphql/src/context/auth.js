import { ApolloError, AuthenticationError, ForbiddenError } from '../errors.js';

const parseHeader = (header) => {
  if (!header) return {};
  const [type, value] = header.trim().replace(/\s\s+/, ' ').split(' ');
  return { type, value };
};

/**
 *
 * @param {object} params
 * @param {string} params.header
 * @param {UserManager} params.userManager
 */
export function AuthContext({ header, userManager } = {}) {
  let authToken;
  let error;
  let promise;
  let user;

  const load = async () => {
    if (!promise) {
      promise = (async () => {
        if (!header) return;
        const { type, value } = parseHeader(header);
        if (type !== 'Bearer') throw new AuthenticationError(`The auth type '${type}' is not supported.`);
        if (!value) return;
        authToken = value;
        user = await userManager.verifyAuthToken({
          authToken,
          projection: { email: 1 },
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
    if (error) throw new AuthenticationError(error.message);
    if (!user) throw new AuthenticationError('You must be logged-in to access this resource.');
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
    if (!id) throw new ApolloError('A user ID is required in order to check if the current user matches');
    const currentUserId = await getUserId();
    if (`${currentUserId}` !== `${id}`) throw new ForbiddenError(message);
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
