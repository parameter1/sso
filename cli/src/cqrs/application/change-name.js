import inquirer from 'inquirer';
import { applicationCommandProps } from '@parameter1/sso-mongodb';
import { getAppList, waitUntilProcessed } from '../utils/index.js';
import { entityManager } from '../../mongodb.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'app',
      message: 'Select the application',
      choices: getAppList,
    },
    {
      type: 'input',
      name: 'name',
      default: ({ app }) => app.name,
      message: 'Enter the new application name',
      filter: (input) => {
        const { value } = applicationCommandProps.name.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error } = applicationCommandProps.name.validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to complete this action?',
      default: false,
    },
  ];

  const {
    confirm,
    app,
    name,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  const handler = entityManager.getCommandHandler('application');
  return waitUntilProcessed(() => handler.changeName({
    entityId: app._id,
    name,
  }));
};
