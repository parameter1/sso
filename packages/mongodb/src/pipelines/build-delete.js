import versionDoc from './version-doc.js';
import { addToSet } from './utils/index.js';

export function buildDeletePipeline({ isVersioned, source, context }) {
  const current = versionDoc({
    n: '$inc',
    source,
    context,
  });

  return [
    {
      $set: {
        _deleted: true,
        ...(isVersioned && {
          '_version.current': current,
          '_version.history': addToSet({ path: '$_version.history', value: current }),
        }),
      },
    },
  ];
}
