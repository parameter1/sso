import inquirer from 'inquirer';
import { entityManager } from '../../mongodb.js';

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
    entityManager.commandHandlers.createIndexes(),
    entityManager.normalizedRepos.createAllIndexes(),
  ]) : null;
};
