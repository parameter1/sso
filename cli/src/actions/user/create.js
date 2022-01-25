import inquirer from 'inquirer';
import { userAttributes as userAttrs } from '@parameter1/sso-db/schema';
import repos from '../../repos.js';

const { log } = console;

export default async () => {
  const questions = [
    {
      type: 'input',
      name: 'email',
      message: 'Enter the new user\'s email address',
      validate: async (input) => {
        const { error } = userAttrs.email.required().validate(input);
        if (error) return error;

        const doc = await repos.$('user').findByEmail({
          email: input,
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
        const { error } = userAttrs.givenName.required().validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'input',
      name: 'familyName',
      message: 'Enter the user\'s last/family name',
      validate: (input) => {
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
    email,
    givenName,
    familyName,
  } = await inquirer.prompt(questions);

  if (!confirm) return;

  const result = await repos.$('user').create({ email, givenName, familyName });
  log(result);
};
