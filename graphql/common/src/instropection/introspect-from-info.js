import introspect from './introspect.js';

export default (info) => introspect({ ...info, selectionSet: info.fieldNodes[0].selectionSet });
