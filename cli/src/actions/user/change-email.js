import inquirer from 'inquirer';
import { userProps } from '@parameter1/sso-mongodb-command';

import getUserList from '../utils/get-user-list.js';
import { materializedRepoManager } from '../../mongodb.js';
import { commands } from '../../service-clients.js';

const repo = materializedRepoManager.get('user');

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'user',
      message: 'Select the user to change the email address for',
      choices: getUserList,
    },
    {
      type: 'input',
      name: 'email',
      message: 'Enter the new email address',
      filter: (input) => {
        const { value } = userProps.email.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error, value } = userProps.email.required().validate(input);
        if (error) return error;
        const doc = await repo.findByEmail({
          email: value,
          options: { projection: { _id: 1 } },
        });
        if (doc) return new Error('A user already exists with this email address');
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
    user,
    email,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  return commands.request('user.changeEmail', {
    input: [{ entityId: user._id, email }],
    awaitProcessing: true,
  });
};
