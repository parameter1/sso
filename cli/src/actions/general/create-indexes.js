import inquirer from 'inquirer';
import { eventStore, normalizedRepoManager, reservations } from '../../mongodb.js';

export default async () => {
  const questions = [
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to complete this action?',
      default: false,
    },
  ];

  const {
    confirm,
  } = await inquirer.prompt(questions);
  return confirm ? Promise.all([
    (async () => {
      const r = await eventStore.createIndexes();
      return { eventStore: r };
    })(),
    (async () => {
      const r = await reservations.createIndexes();
      return { reservations: r };
    })(),
    (async () => {
      const r = await normalizedRepoManager.createAllIndexes();
      return { normalizedRepoManager: r };
    })(),
    // entityManager.materializedRepos.createAllIndexes(),
    // userManager.createIndexes(),
  ]) : null;
};
