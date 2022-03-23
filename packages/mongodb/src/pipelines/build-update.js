import { isFunction as isFn } from '@parameter1/utils';
import { cleanDocument } from '@parameter1/mongodb';
import is from '@sindresorhus/is';

import { addToSet, pull, Expr } from './utils/index.js';

/**
 *
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
      const jsonA = JSON.stringify(cleanDocument(a, { preserveEmptyArrays: true }));
      const jsonB = JSON.stringify(cleanDocument(b, { preserveEmptyArrays: true }));
      if (jsonA > jsonB) return 1;
      if (jsonA < jsonB) return -1;
      return 0;
    });
  }
  throw new Error('Sorting non-scalar, non-plain object or mixed typed arrays is not supported');
};

export function prepareValue(value) {
  if (is.directInstanceOf(value, Expr)) return value.expr;
  if (is.array(value)) return cleanArray(value);
  return value;
}

export default function buildUpdatePipeline(fields = [], {
  updatedDatePath = 'date.updated',
  updatedDateCondition,
} = {}) {
  const f = fields.map((field) => {
    const { path, value } = field;
    const paths = {
      field: path,
      willChange: `__will_change.${path}`,
    };
    return {
      ...field,
      value: prepareValue(value),
      paths,
      prefixedPaths: Object.keys(paths)
        .reduce((o, key) => ({ ...o, [key]: `$${paths[key]}` }), {}),
    };
  });

  const $addFields = {
    // determine which fields will change and expose current values
    ...f.reduce((o, {
      paths,
      prefixedPaths,
      value,
      arrayMode,
    }) => {
      if (arrayMode === 'addToSet') {
        // will change when the size of the difference between
        // the new and existing values is greater than 0
        return {
          ...o,
          [paths.willChange]: {
            $gt: [{ $size: { $setDifference: [value, prefixedPaths.field] } }, 0],
          },
        };
      }

      if (arrayMode === 'pull') {
        // will change when the size of the common values between
        // the new and existing values is greater than 0
        return {
          ...o,
          [paths.willChange]: {
            $gt: [{ $size: { $setIntersection: [value, prefixedPaths.field] } }, 0],
          },
        };
      }

      // will change when the existing value is not equal to the new value
      return {
        ...o,
        [paths.willChange]: { $ne: [prefixedPaths.field, value] },
      };
    }, {}),
  };

  const pipeline = [
    // add individual field changes and any current values
    { $addFields },
    // then determine if _any_ of the fields will change
    {
      $addFields: {
        '__will_change.__any': {
          $anyElementTrue: [f.map(({ prefixedPaths }) => prefixedPaths.willChange)],
        },
      },
    },
    // set the new values
    {
      $set: f.reduce((o, field) => {
        const { prefixedPaths, value, arrayMode } = field;
        let resolved = value;
        if (arrayMode === 'addToSet') {
          resolved = addToSet({ path: prefixedPaths.field, value });
        }
        if (arrayMode === 'pull') {
          resolved = pull({ input: prefixedPaths.field, value });
        }
        return {
          ...o,
          [field.paths.field]: resolved,
          ...(isFn(field.set) && field.set(field)),
        };
      }, {
        ...(updatedDatePath && {
          [updatedDatePath]: {
            $cond: [updatedDateCondition || '$__will_change.__any', '$$NOW', `$${updatedDatePath}`],
          },
        }),
      }),
    },
    // remove the change flags so they aren't saved to the document :)
    { $unset: ['__will_change'] },
  ];
  return pipeline;
}
