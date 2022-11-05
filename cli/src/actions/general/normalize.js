import inquirer from 'inquirer';
import { entityCommandClient } from '../../clients/entity-command.js';

export default async () => {
  const questions = [
    {
      type: 'checkbox',
      name: 'entityTypes',
      message: 'Select the entity types to normalize',
      choices: async () => entityCommandClient.request('normalize.getEntityTypes'),
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
  return new Map(await entityCommandClient.request('normalize.types', { entityTypes }));
};
