import inquirer from 'inquirer';
import { userCommandProps } from '@parameter1/sso-mongodb';
import { entityManager } from '../../mongodb.js';
import { waitUntilProcessed } from '../utils/index.js';

export default async () => {
  const questions = [
    {
      type: 'input',
      name: 'email',
      message: 'Enter the new user\'s email address',
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
      type: 'input',
      name: 'givenName',
      message: 'Enter the user\'s first/given name',
      validate: (input) => {
        const { error } = userCommandProps.givenName.required().validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'input',
      name: 'familyName',
      message: 'Enter the user\'s last/family name',
      validate: (input) => {
        const { error } = userCommandProps.familyName.required().validate(input);
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
    email,
    givenName,
    familyName,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  const handler = entityManager.getCommandHandler('user');
  return waitUntilProcessed(() => handler.create({
    values: { email, givenName, familyName },
  }));
};
