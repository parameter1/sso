import { gulpfile } from '@parameter1/gulp';

gulpfile({
  entry: 'src/index.js',
  watchPaths: ['src/**/*.js', '../../packages/mongodb/src/**/*.js', '../common/src/**/*.js'],
});
