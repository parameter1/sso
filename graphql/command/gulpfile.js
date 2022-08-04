import { gulpfile } from '@parameter1/gulp';

gulpfile({
  entry: 'src/index.js',
  watchPaths: [
    'src/**/*.js',
    '../../packages/mongodb/src/**/*.js',
    '../../packages/graphql-redis-pubsub/src/**/*.js',
    '../common/src/**/*.js',
  ],
});
