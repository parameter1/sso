import repos from '../repos.js';

export default async function createIndexes() {
  await repos.createAllIndexes();
}
