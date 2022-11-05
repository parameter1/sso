import inquirer from 'inquirer';
import { EntityTypes } from '@parameter1/sso-entity-types';
import { materializers } from '../../mongodb.js';

export default async () => {
  const questions = [
    {
      type: 'checkbox',
      name: 'entityTypes',
      message: 'Select the entity types to materialize',
      choices: () => EntityTypes.getKeys(),
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
  return new Map(await Promise.all(entityTypes.map(async (entityType) => {
    await materializers.materializeUsingQuery(entityType, {});
    return [entityType, 'ok'];
  })));
};
