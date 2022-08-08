import inquirer from 'inquirer';
import { userCommandProps } from '@parameter1/sso-mongodb';
import { getUserList, waitUntilProcessed } from '../utils/index.js';
import { entityManager } from '../../mongodb.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'user',
      message: 'Select the user to change names for',
      choices: getUserList,
    },
    {
      type: 'input',
      name: 'givenName',
      default: ({ user }) => user.givenName,
      message: 'Enter the new first/given name',
      filter: (input) => {
        const { value } = userCommandProps.givenName.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error } = userCommandProps.givenName.required().validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'input',
      name: 'familyName',
      default: ({ user }) => user.familyName,
      message: 'Enter the new last/family name',
      filter: (input) => {
        const { value } = userCommandProps.familyName.required().validate(input);
        return value;
      },
      validate: async (input) => {
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
    user,
    givenName,
    familyName,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  const handler = entityManager.getCommandHandler('user');
  return waitUntilProcessed(() => handler.changeName({
    entityId: user._id,
    givenName,
    familyName,
  }));
};
