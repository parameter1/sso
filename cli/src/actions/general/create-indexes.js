import inquirer from 'inquirer';
import {
  commandHandler,
  materializedRepoManager,
  normalizedRepoManager,
  tokenRepo,
  userLogRepo,
} from '../../mongodb.js';

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
  if (!confirm) return null;
  return new Map(await Promise.all([
    (async () => {
      const r = await commandHandler.createIndexes();
      return ['command', r];
    })(),
    (async () => {
      const r = await normalizedRepoManager.createAllIndexes();
      return ['normalized', r];
    })(),
    (async () => {
      const r = await materializedRepoManager.createAllIndexes();
      return ['materialized', r];
    })(),
    (async () => {
      const r = await tokenRepo.createIndexes();
      return ['token', r];
    })(),
    (async () => {
      const r = await userLogRepo.createIndexes();
      return ['userlog', r];
    })(),
  ]));
};
