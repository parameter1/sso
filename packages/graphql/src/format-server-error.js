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

export function formatServerError(err, { originalError } = {}) {
  // if the error does not have a status code, attempt to set from the original
  if (!get(err, 'extensions.statusCode')) {
    const originalStatusCode = get(originalError, 'statusCode');
    if (originalStatusCode) {
      set(err, 'extensions.statusCode', originalStatusCode);
      // if original error had a status and the incoming error does not, re-align to gql code
      const code = STATUS_CODES[originalStatusCode];
      if (code) {
        set(err, 'extensions.code', code.replace(/\s/g, '_').toUpperCase());
      }
    }
  }

  // if still not set, attempt to align a status code with the graphql code
  if (!get(err, 'extensions.statusCode')) {
    const code = get(err, 'extensions.code');
    set(err, 'extensions.statusCode', codes[code] || 500);
  }
  return err;
}
