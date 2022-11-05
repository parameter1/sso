import inquirer from 'inquirer';
import { entityMaterializerClient } from '../../clients.js';

export default async () => {
  const questions = [
    {
      type: 'checkbox',
      name: 'entityTypes',
      message: 'Select the entity types to materialize',
      choices: async () => entityMaterializerClient.getEntityTypes(),
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
  return new Map(await entityMaterializerClient.materializeTypes({ entityTypes }));
};
