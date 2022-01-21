import { makeExecutableSchema } from '@parameter1/graphql/schema';
import { enumDefaultValuesTransformer } from '@parameter1/graphql/transformers';
import { projectDirectiveTransformer } from '@parameter1/graphql/directives';

import resolvers from './resolvers/index.js';
import typeDefs from './definitions/index.js';
import enums from './enums.js';

const schema = makeExecutableSchema({
  resolvers,
  typeDefs,
});

const withProjectSchema = projectDirectiveTransformer(schema);

// handle enum default values
const withEnumDefaults = enumDefaultValuesTransformer(withProjectSchema, enums);

export default withEnumDefaults;
