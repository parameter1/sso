import getProjection from './get.js';

export default (info, { pathPrefix } = {}) => {
  const {
    returnType,
    fieldNodes,
    schema,
    fragments,
  } = info;
  return getProjection({
    schema,
    returnType,
    selectionSet: fieldNodes[0].selectionSet,
    fragments,
    pathPrefix,
  });
};
