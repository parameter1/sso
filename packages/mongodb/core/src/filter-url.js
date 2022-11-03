/**
 * @param {import("mongodb").MongoClient} client
 * @returns {string}
 */
export function filterMongoURL(client) {
  const { url, options } = client.s;
  const { auth, credentials } = options;
  if (!auth && !credentials) return url;
  const { username, password } = auth || credentials;
  if (username || password) return `${url}`.replace(username, '*****').replace(password, '*****');
  return url;
}
