import { isFunction as isFn } from '@parameter1/utils';
import { cleanDocument } from '@parameter1/mongodb';
import is from '@sindresorhus/is';

/**
 * @todo move to mongodb lib!
 */
const cleanArray = (value = []) => {
  if (!value.length) return [];
  // filter null and undefined
  const filtered = value.filter((v) => {
    if (v == null) return false;
    if (is.plainObject(v) && is.emptyObject(v)) return false;
    return true;
  });
  if (!filtered.length) return [];
  if (is.array(filtered, is.number)
    || is.array(filtered, is.string)
    || is.array(filtered, is.boolean)
  ) {
    return filtered.sort();
  }
  if (is.array(filtered, is.plainObject)) {
    return filtered.sort((a, b) => {
      const jsonA = JSON.stringify(cleanDocument(a));
      const jsonB = JSON.stringify(cleanDocument(b));
      if (jsonA > jsonB) return 1;
      if (jsonA < jsonB) return -1;
      return 0;
    });
  }
  throw new Error('Sorting non-scalar, non-plain object or mixed typed arrays is not supported');
};

export function prepareValue(value) {
  if (is.array(value)) return cleanArray(value);
  return value;
}

export default function buildUpdatePipeline(fields = [], {
  now = new Date(),
  updatedDatePath = 'date.updated',
} = {}) {
  const expose = [];

  const f = fields.map((field) => {
    const {
      exposeCurrentValue,
      path,
      set,
      arrayMode,
      value,
    } = field;
    if (arrayMode && !Array.isArray(value)) throw new Error('You cannot specify an array field without an array value');
    const prefixedPath = `$${path}`;
    if (exposeCurrentValue || isFn(set)) expose.push({ current: `__current:${path}`, prefixedPath });
    return { ...field, value: prepareValue(value), prefixedPath };
  });

  const pipeline = [
    {
      $addFields: {
        __didChange: {
          // when _any_ of the conditions are true
          $or: f.reduce((or, { prefixedPath, value, arrayMode }) => {
            if (arrayMode === 'addToSet') {
              // when the size of the difference between
              // the new and existing values is greater than 0
              or.push({ $gt: [{ $size: { $setDifference: [value, prefixedPath] } }, 0] });
              return or;
            }
            if (arrayMode === 'pull') {
              // when the size of the common values between
              // the new and existing values is greater than 0
              or.push({ $gt: [{ $size: { $setIntersection: [value, prefixedPath] } }, 0] });
              return or;
            }
            // when the existing value is not equal to the new value
            or.push({ $ne: [prefixedPath, value] });
            return or;
          }, []),
        },
        ...expose.reduce((o, { current, prefixedPath }) => ({
          ...o, [current]: prefixedPath,
        }), {}),
      },
    },
    {
      $set: f.reduce((o, {
        prefixedPath,
        path,
        value,
        set,
        arrayMode,
      }) => {
        let resolved = value;
        if (arrayMode === 'addToSet') {
          resolved = { $setUnion: [value, prefixedPath] };
        }
        if (arrayMode === 'pull') {
          resolved = {
            $filter: {
              input: prefixedPath,
              as: 'v',
              cond: { $not: { $in: ['$$v', value] } },
            },
          };
        }
        return {
          ...o,
          [path]: resolved,
          ...(isFn(set) && set()),
        };
      }, {
        ...(updatedDatePath && {
          [updatedDatePath]: { $cond: ['$__didChange', now, `$${updatedDatePath}`] },
        }),
      }),
    },
    { $unset: ['__didChange', ...expose.map(({ current }) => current)] },
  ];
  return pipeline;
}
