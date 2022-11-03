import inquirer from 'inquirer';
import { eventStore } from '../../mongodb.js';
// import { entityManager, userManager } from '../../mongodb.js';

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
    // entityManager.commandHandlers.createIndexes(),
    // entityManager.materializedRepos.createAllIndexes(),
    // entityManager.normalizedRepos.createAllIndexes(),
    // userManager.createIndexes(),
  ]) : null;
};
