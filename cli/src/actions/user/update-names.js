import inquirer from 'inquirer';
import { userProps } from '@parameter1/sso-mongodb';
import getUserList from '../utils/get-user-list.js';
import repos from '../../repos.js';

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
        const { value } = userProps.givenName.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error } = userProps.givenName.required().validate(input);
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
        const { value } = userProps.familyName.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error } = userProps.familyName.required().validate(input);
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

  return confirm ? repos.$('user').updateProps({
    id: user._id,
    givenName,
    familyName,
  }) : null;
};
