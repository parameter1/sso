/* eslint-disable no-param-reassign */
import { mapSchema, MapperKind } from '@parameter1/graphql/utils';
import { getDirectiveArgs } from '@parameter1/graphql/directives';

export function connectionProjectDirectiveTransformer(schema, directiveName = 'connectionProject') {
  return mapSchema(schema, {
    [MapperKind.OBJECT_TYPE]: (objConfig) => {
      const args = getDirectiveArgs(schema, objConfig, directiveName);
      if (args && objConfig.astNode) objConfig.astNode.$connectionProjectType = args.type;
    },
  });
}
