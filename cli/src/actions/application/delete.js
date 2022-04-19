import inquirer from 'inquirer';
import { getAppList } from '../utils/index.js';
import repos from '../../repos.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'app',
      message: 'Select the application to delete',
      choices: getAppList,
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
  } = await inquirer.prompt(questions);

  return confirm ? repos.$('application').deleteForId({
    id: app._id,
  }) : null;
};
