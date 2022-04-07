import versionDoc from './version-doc.js';
import { addToSet } from './utils/index.js';

export function buildDeletePipeline({ source, context }) {
  const current = versionDoc({
    n: { $add: ['$_version.current.n', 1] },
    deleted: true,
    source,
    context,
  });

  return [
    {
      $set: {
        '_version.current': current,
        '_version.history': addToSet({ path: '$_version.history', value: current }),
      },
    },
  ];
}
