import inquirer from 'inquirer';
import { userAttributes as userAttrs } from '@parameter1/sso-db/schema';
import getUserList from './utils/get-user-list.js';
import repos from '../repos.js';

const { log } = console;

export default async function createInstance() {
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
      default: ({ user }) => user.name.given,
      message: 'Enter the new first/given name',
      validate: async (input) => {
        const { error } = userAttrs.givenName.required().validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'input',
      name: 'familyName',
      default: ({ user }) => user.name.family,
      message: 'Enter the new last/family name',
      validate: async (input) => {
        const { error } = userAttrs.familyName.required().validate(input);
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

  if (!confirm) return;

  const result = await repos.$('user').updateName({
    id: user._id,
    givenName,
    familyName,
  });
  log(result);
}