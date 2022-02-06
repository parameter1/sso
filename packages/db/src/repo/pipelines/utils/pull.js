import is from '@sindresorhus/is';

/**
 * @param {object} params
 * @param {string|object} params.input The existing array input, as a path or expr
 * @param {array|*} params.value The value(s) to remove from the array.
 */
export default ({ input, value } = {}) => {
  const cond = is.array(value)
    ? { $not: { $in: ['$$v', value] } }
    : { $ne: ['$$v', value] };
  return { $filter: { input, as: 'v', cond } };
};
