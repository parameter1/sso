import gulpfile from '@parameter1/gulp/factory.js';

gulpfile({
  entry: 'src/index.js',
  watchPaths: [
    'src/**/*.js',
    '../../packages/graphql-redis-pubsub/src/**/*.js',
    '../../packages/mongodb/src/**/*.js',
  ],
});
