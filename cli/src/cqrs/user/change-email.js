import inquirer from 'inquirer';
import { userCommandProps } from '@parameter1/sso-mongodb';
import { getUserList, waitUntilProcessed } from '../utils/index.js';
import { entityManager } from '../../mongodb.js';

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
        const { value } = userCommandProps.email.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error, value } = userCommandProps.email.required().validate(input);
        if (error) return error;
        const doc = await entityManager.getMaterializedRepo('user').findByEmail({
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

  const handler = entityManager.getCommandHandler('user');
  return waitUntilProcessed(() => handler.changeEmail({
    entityId: user._id,
    email,
  }));
};
