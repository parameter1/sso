/* eslint-disable no-param-reassign */
import { getDirectiveArgs, mapSchema, MapperKind } from '@parameter1/graphql-utils';

export function connectionProjectDirectiveTransformer(schema, directiveName = 'connectionProject') {
  return mapSchema(schema, {
    [MapperKind.OBJECT_TYPE]: (objConfig) => {
      const args = getDirectiveArgs(schema, objConfig, directiveName);
      if (args && objConfig.astNode) objConfig.astNode.$connectionProjectType = args.type;
    },
  });
}
