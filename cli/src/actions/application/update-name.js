import inquirer from 'inquirer';
import { applicationProps } from '@parameter1/sso-mongodb';
import { getAppList } from '../utils/index.js';
import repos from '../../repos.js';

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

  return confirm ? repos.$('application').updateName({
    id: app._id,
    name,
  }) : null;
};
