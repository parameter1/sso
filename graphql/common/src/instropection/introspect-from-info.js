import introspect from './introspect.js';

export default (info, { shallow = false } = {}) => introspect({
  ...info,
  selectionSet: info.fieldNodes[0].selectionSet,
  shallow,
});
