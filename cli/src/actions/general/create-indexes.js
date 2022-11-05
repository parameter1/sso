import inquirer from 'inquirer';
import { entityCommandClient, entityMaterializerClient, entityNormalizerClient } from '../../clients.js';

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
      const r = await entityCommandClient.createIndexes();
      return ['command', r];
    })(),
    (async () => {
      const r = await entityNormalizerClient.createIndexes();
      return ['normalizer', r];
    })(),
    (async () => {
      const r = await entityMaterializerClient.createIndexes();
      return ['materializer', r];
    })(),
    // userManager.createIndexes(),
  ]));
};
