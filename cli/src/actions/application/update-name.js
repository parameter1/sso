import inquirer from 'inquirer';
import { applicationAttributes as appAttrs } from '@parameter1/sso-db/schema';
import { getAppList } from '../utils/index.js';
import repos from '../../repos.js';

const { log } = console;

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
      validate: async (input) => {
        const { error } = appAttrs.name.required().validate(input);
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

  if (!confirm) return;

  const result = await repos.$('application').updateName({
    id: app._id,
    name,
  });
  log(result);
};
