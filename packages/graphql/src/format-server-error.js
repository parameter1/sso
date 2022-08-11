import { STATUS_CODES } from 'http';
import { get, set } from '@parameter1/object-path';

const codes = {
  ...Object.keys(STATUS_CODES).reduce((o, key) => {
    const statusCode = parseInt(key, 10);
    if (key < 400) return o;
    const code = STATUS_CODES[key].replace(/\s/g, '_').toUpperCase();
    return { ...o, [code]: statusCode };
  }, {}),
  BAD_USER_INPUT: 400,
  GRAPHQL_PARSE_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  GRAPHQL_VALIDATION_FAILED: 422,
};

export function formatServerError(err) {
  const statusCode = get(err, 'extensions.exception.statusCode');
  const code = get(err, 'extensions.code');

  if (statusCode) set(err, 'extensions.code', STATUS_CODES[statusCode].replace(/\s/g, '_').toUpperCase());
  if (!statusCode && codes[code]) set(err, 'extensions.exception.statusCode', codes[code]);

  if (get(err, 'extensions.exception.statusCode', 500) >= 500) {
    // @todo send the error to new relic!
  }
  return err;
}
