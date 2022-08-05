import { makeExecutableSchema } from '@parameter1/graphql/schema';
import { enumDefaultValuesTransformer } from '@parameter1/graphql/transformers';
import {
  arrayDirectiveTransformer,
  interfaceFieldsDirectiveTransformer,
} from '@parameter1/graphql/directives';
import {
  authDirectiveTransformer,
  connectionProjectDirectiveTransformer,
  projectDirectiveTransformer,
} from '@parameter1/sso-graphql';

import enums from './enums.js';
import resolvers from './resolvers/index.js';
import typeDefs from './definitions/index.js';

const schema = makeExecutableSchema({
  resolvers,
  typeDefs,
});

const withInterfaceFields = interfaceFieldsDirectiveTransformer(schema);
const withProject = projectDirectiveTransformer(withInterfaceFields);
const withConnectionProject = connectionProjectDirectiveTransformer(withProject);
const withAuth = authDirectiveTransformer(withConnectionProject);
const withArray = arrayDirectiveTransformer(withAuth);

// handle enum default values
const withEnumDefaults = enumDefaultValuesTransformer(withArray, enums);

export default withEnumDefaults;
