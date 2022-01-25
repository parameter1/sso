import repos from '../../repos.js';

export default async () => {
  await repos.createAllIndexes();
};
