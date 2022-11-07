import inquirer from 'inquirer';
import { applicationProps } from '@parameter1/sso-mongodb-command';

import getAppList from '../utils/get-app-list.js';
import { commands } from '../../service-clients.js';

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
        const { value } = applicationProps.name.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error } = applicationProps.name.validate(input);
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

  return commands.request('application.changeName', {
    input: [{ entityId: app._id, name }],
    awaitProcessing: true,
  });
};
