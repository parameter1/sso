import { Kind } from '@parameter1/graphql';
import { get, getAsArray } from '@parameter1/object-path';

const getReturnType = (type) => {
  if (type.ofType) return getReturnType(type.ofType);
  return type;
};

const getDeepSelections = ({
  schema,
  returnType,
  selections = [],
  map = new Map(),
  parentFieldName = '',
  fragments,
}) => {
  if (!selections.length) return map;
  const type = getReturnType(returnType);
  // will need to figure out fragments...
  selections.forEach((selection) => {
    const subSelections = getAsArray(selection, 'selectionSet.selections');

    if (selection.kind === Kind.FIELD) {
      const field = type.getFields()[selection.name.value];
      const $project = get(field, 'astNode.$project');
      if (!$project) return;

      const { name: currentFieldName } = $project;

      const fieldParts = [];
      if (parentFieldName) fieldParts.push(parentFieldName);
      if (currentFieldName) fieldParts.push(currentFieldName);
      const fieldName = fieldParts.join('.');

      $project.needs.forEach((name) => {
        const needs = parentFieldName ? `${parentFieldName}.${name}` : name;
        map.set(needs, parentFieldName);
      });

      if (subSelections.length && $project.deep) {
        getDeepSelections({
          schema,
          returnType: field.type,
          selections: subSelections,
          map,
          parentFieldName: fieldName,
          fragments,
        });
      } else {
        map.set(fieldName, parentFieldName);
      }
    }

    if (selection.kind === Kind.INLINE_FRAGMENT) {
      const { typeCondition } = selection;
      getDeepSelections({
        schema,
        returnType: schema.getType(typeCondition.name.value),
        selections: subSelections,
        map,
        parentFieldName,
        fragments,
      });
    }

    if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const { name } = selection;
      const fragment = fragments[name.value];
      const { typeCondition } = fragment;

      getDeepSelections({
        schema,
        returnType: schema.getType(typeCondition.name.value),
        selections: getAsArray(fragment, 'selectionSet.selections'),
        map,
        parentFieldName,
        fragments,
      });
    }
  });
  return map;
};

export default ({
  schema,
  returnType,
  selectionSet,
  fragments,
  pathPrefix,
} = {}) => {
  const { selections = [] } = selectionSet;
  const toProject = getDeepSelections({
    selections,
    returnType,
    fragments,
    schema,
  });

  const fields = pathPrefix
    ? [...toProject.keys()].map((path) => `${pathPrefix}.${path}`)
    : toProject.keys();

  const projection = {};
  const nodeFields = new Set();

  toProject.forEach((parentPath, path) => {
    const fullPath = pathPrefix ? `${pathPrefix}.${path}` : path;
    projection[fullPath] = 1;
    const pattern = new RegExp(`^${parentPath}\\.`, 'i');
    nodeFields.add(path.replace(pattern, ''));
  });

  return {
    fields: new Set(fields),
    projection,
    mappedFields: toProject,
    nodeFields,
  };
};
