import inquirer from 'inquirer';
import {
  materializedRepoManager,
  normalizedRepoManager,
  tokenRepo,
  userLogRepo,
} from '../../mongodb.js';
import { commands } from '../../service-clients.js';

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
      const r = await commands.request('createIndexes');
      return ['command', new Map(r)];
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
