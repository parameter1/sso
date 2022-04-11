import inquirer from 'inquirer';
import { getOrgList } from '../utils/index.js';
import repos from '../../repos.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization to delete',
      choices: getOrgList,
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
    org,
  } = await inquirer.prompt(questions);

  return confirm ? repos.$('organization').deleteForId({
    id: org._id,
  }) : null;
};
