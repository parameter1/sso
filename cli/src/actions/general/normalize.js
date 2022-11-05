import inquirer from 'inquirer';
import { entityNormalizerClient } from '../../clients/entity-normalizer.js';

export default async () => {
  const questions = [
    {
      type: 'checkbox',
      name: 'entityTypes',
      message: 'Select the entity types to normalize',
      choices: async () => entityNormalizerClient.request('getEntityTypes'),
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to complete this action?',
      default: false,
    },
  ];

  const { entityTypes, confirm } = await inquirer.prompt(questions);
  if (!confirm || !entityTypes.length) return [];
  return new Map(await entityNormalizerClient.request('types', { entityTypes }));
};
