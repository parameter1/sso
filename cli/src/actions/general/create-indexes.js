import inquirer from 'inquirer';
import { entityCommandClient } from '../../clients/entity-command.js';
import { entityMaterializerClient } from '../../clients/entity-materializer.js';
import { entityNormalizerClient } from '../../clients/entity-normalizer.js';

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
      const r = await entityCommandClient.request('createIndexes');
      return ['command', new Map(r)];
    })(),
    (async () => {
      const r = await entityNormalizerClient.request('createIndexes');
      return ['normalizer', new Map(r)];
    })(),
    (async () => {
      const r = await entityMaterializerClient.request('createIndexes');
      return ['materializer', new Map(r)];
    })(),
    // userManager.createIndexes(),
  ]));
};
