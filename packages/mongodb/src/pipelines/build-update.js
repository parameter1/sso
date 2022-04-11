import { isFunction as isFn } from '@parameter1/utils';

import { CleanDocument } from '../utils/clean-document.js';
import { addToSet, pull } from './utils/index.js';
import versionDoc from './version-doc.js';

export default function buildUpdatePipeline(fields = [], {
  isVersioned,
  source,
  context,

  versionCondition,
} = {}) {
  const f = fields.map((field) => {
    const { path, value } = field;
    const paths = {
      field: path,
      willChange: `__will_change.${path}`,
    };
    return {
      ...field,
      value: CleanDocument.value(value),
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

  const current = versionDoc({ n: '$inc', source, context });
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
        ...(isVersioned && {
          '_version.current': { $cond: [versionCondition || '$__will_change.__any', current, '$_version.current'] },
          '_version.history': {
            $cond: [
              versionCondition || '$__will_change.__any',
              addToSet({ path: '$_version.history', value: current }),
              '$_version.history',
            ],
          },
        }),
      }),
    },
    // remove the change flags so they aren't saved to the document :)
    { $unset: ['__will_change'] },
  ];
  return pipeline;
}
