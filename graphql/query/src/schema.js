import {
  arrayDirectiveTransformer,
  authDirectiveTransformer,
  enumDefaultValuesTransformer,
  interfaceFieldsDirectiveTransformer,
  connectionProjectDirectiveTransformer,
  makeExecutableSchema,
  objectDirectiveTransformer,
  projectDirectiveTransformer,
} from '@parameter1/sso-graphql';
import loadOwnerDirectiveTransformer from './directives/load-owner.js';

import enums from './enums.js';
import resolvers from './resolvers/index.js';
import typeDefs from './definitions/index.js';

const schema = makeExecutableSchema({ resolvers, typeDefs });

const withInterfaceFields = interfaceFieldsDirectiveTransformer(schema);
const withProject = projectDirectiveTransformer(withInterfaceFields);
const withConnectionProject = connectionProjectDirectiveTransformer(withProject);
const withAuth = authDirectiveTransformer(withConnectionProject);
const withArray = arrayDirectiveTransformer(withAuth);
const withObject = objectDirectiveTransformer(withArray);
const withEnumDefaults = enumDefaultValuesTransformer(withObject, enums);
const withLoadOwner = loadOwnerDirectiveTransformer(withEnumDefaults);

export default withLoadOwner;
