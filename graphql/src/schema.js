import { makeExecutableSchema } from '@parameter1/graphql/schema';
import { enumDefaultValuesTransformer } from '@parameter1/graphql/transformers';
import {
  arrayDirectiveTransformer,
  projectDirectiveTransformer,
} from '@parameter1/graphql/directives';

import resolvers from './resolvers/index.js';
import typeDefs from './definitions/index.js';
import enums from './enums.js';
import authDirectiveTransformer from './directives/auth.js';

const schema = makeExecutableSchema({
  resolvers,
  typeDefs,
});

const withProjectSchema = projectDirectiveTransformer(schema);
const withAuth = authDirectiveTransformer(withProjectSchema);
const withArrays = arrayDirectiveTransformer(withAuth);

// handle enum default values
const withEnumDefaults = enumDefaultValuesTransformer(withArrays, enums);

export default withEnumDefaults;
