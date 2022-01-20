import { gulpfile } from '@parameter1/gulp';

gulpfile({
  entry: 'src/index.js',
  watchPaths: ['src/**/*.js', '../packages/db/src/**/*.js'],
});
