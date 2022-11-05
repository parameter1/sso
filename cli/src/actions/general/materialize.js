import inquirer from 'inquirer';
import { materializers } from '../../mongodb.js';

export default async () => {
  const questions = [
    {
      type: 'checkbox',
      name: 'entityTypes',
      message: 'Select the entity types to materialize',
      choices: () => [...materializers.builders.keys()],
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to complete this action?',
      default: false,
    },
  ];

  const { entityTypes, confirm } = await inquirer.prompt(questions);
  return confirm ? Promise.all(entityTypes.map(async (entityType) => {
    await materializers.materializeUsingQuery(entityType, {});
    return { [entityType]: 'ok' };
  })) : [];
};
