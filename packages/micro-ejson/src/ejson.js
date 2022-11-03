import { jsonClient, jsonServer } from '@parameter1/micro';
import { EJSON } from 'bson';

/**
 * Creates an EJSON client for sending requests to an EJSON server.
 *
 * @param {object} params
 * @param {string} params.url The server URL
 * @param {object} [params.headers] Global HTTP headers to send with all requests
 */
export function ejsonClient(params) {
  return jsonClient({
    parse: EJSON.parse,
    stringify: EJSON.stringify,
    ...params,
  });
}

/**
 * Creates an EJSON micro HTTP server.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {object} params.actions
 * @param {object|function} [params.context]
 * @param {string} [params.limit]
 * @param {function} [params.onActionStart]
 * @param {function} [params.onActionEnd]
 * @param {function} [params.onError]
 * @param {function} [params.errorResponseFn]
 * @param {function|boolean} [params.logErrors]
 */
export function ejsonServer(params) {
  return jsonServer({
    parse: EJSON.parse,
    stringify: EJSON.stringify,
    ...params,
  });
}
