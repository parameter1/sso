import inquirer from 'inquirer';
import managedRepos, { materializedRepos } from '../../repos.js';

export default async () => {
  const questions = [
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to complete this action?',
      default: false,
    },
  ];

  const {
    confirm,
  } = await inquirer.prompt(questions);
  return confirm ? Promise.all([
    managedRepos.createAllIndexes(),
    materializedRepos.createAllIndexes(),
  ]) : null;
};
