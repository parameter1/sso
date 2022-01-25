import inquirer from 'inquirer';
import { applicationAttributes as appAttrs } from '@parameter1/sso-db/schema';
import { getAppList } from '../utils/index.js';
import repos from '../../repos.js';
import create from './create.js';

const { log } = console;

export default async () => {
  const appList = await getAppList();
  const questions = [
    {
      type: 'list',
      name: 'app',
      when: Boolean(appList.length),
      message: 'Select the application',
      choices: appList,
    },
    {
      type: 'confirm',
      name: 'createApp',
      when: Boolean(!appList.length),
      message: 'No applications exit. Would you like to create one?',
      default: false,
    },
    {
      type: 'input',
      name: 'name',
      default: ({ app }) => app.name,
      message: 'Enter the new application name',
      when: ({ app }) => Boolean(app),
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
      when: ({ app }) => Boolean(app),
    },
  ];

  const {
    createApp,
    confirm,
    app,
    name,
  } = await inquirer.prompt(questions);

  if (createApp) {
    return create();
  }

  if (!confirm || !app) return null;

  const result = await repos.$('application').updateName({
    id: app._id,
    name,
  });
  return log(result);
};
