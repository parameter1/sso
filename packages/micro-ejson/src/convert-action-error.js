import { micro } from '@parameter1/micro';

export const { createError } = micro;

export async function covertActionError(fn, allowedCodes = new Set([401, 403, 404])) {
  try {
    const result = await fn();
    return result;
  } catch (e) {
    if (allowedCodes.has(e.statusCode)) throw e;
    e.statusCode = 500;
    throw e;
  }
}
