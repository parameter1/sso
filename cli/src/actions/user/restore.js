import inquirer from 'inquirer';

import getUserList from '../utils/get-user-list.js';
import { commands } from '../../service-clients.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'user',
      message: 'Select the user to restore',
      choices: () => getUserList({
        query: { _deleted: true },
      }),
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

  return commands.request('user.restore', {
    input: [{ entityId: user._id, email: user.email }],
    awaitProcessing: true,
  });
};
