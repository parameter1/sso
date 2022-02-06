import is from '@sindresorhus/is';

/**
 * @param {object} params
 * @param {string} params.path The prefixed path to set to
 * @param {array|*} params.value The value(s) to add to the set
 */
export default ({ path, value } = {}) => {
  const values = is.array(value) ? value : [value];
  return { $setUnion: [path, values] };
};
