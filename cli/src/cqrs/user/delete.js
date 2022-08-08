import inquirer from 'inquirer';
import { getUserList, waitUntilProcessed } from '../utils/index.js';
import { entityManager } from '../../mongodb.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'user',
      message: 'Select the user to delete',
      choices: getUserList,
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
    user,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  const handler = entityManager.getCommandHandler('user');
  return waitUntilProcessed(() => handler.delete({
    entityId: user._id,
  }));
};
