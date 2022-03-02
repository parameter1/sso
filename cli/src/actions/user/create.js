import inquirer from 'inquirer';
import { userProps } from '@parameter1/sso-mongodb';
import repos from '../../repos.js';

const { log } = console;

export default async () => {
  const questions = [
    {
      type: 'input',
      name: 'email',
      message: 'Enter the new user\'s email address',
      transformer: (input) => {
        const { value } = userProps.email.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error, value } = userProps.email.required().validate(input);
        if (error) return error;

        const doc = await repos.$('user').findByEmail({
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
        const { error } = userProps.givenName.required().validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'input',
      name: 'familyName',
      message: 'Enter the user\'s last/family name',
      validate: (input) => {
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
    email,
    givenName,
    familyName,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('user').create({ email, givenName, familyName });
  log(result);
};
