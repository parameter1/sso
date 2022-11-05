import inquirer from 'inquirer';
import { entityNormalizerClient } from '../../clients.js';

export default async () => {
  const questions = [
    {
      type: 'checkbox',
      name: 'entityTypes',
      message: 'Select the entity types to normalize',
      choices: async () => entityNormalizerClient.getEntityTypes(),
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to complete this action?',
      default: false,
    },
  ];

  const { entityTypes, confirm } = await inquirer.prompt(questions);
  if (!confirm) return [];
  return new Map(await entityNormalizerClient.normalizeTypes({ entityTypes }));
};
