import inquirer from 'inquirer';
import { applicationProps } from '@parameter1/sso-mongodb';
import { sluggify } from '@parameter1/slug';
import repos from '../../repos.js';

export default async () => {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter the application name',
      filter: (input) => {
        const { value } = applicationProps.name.required().validate(input);
        return value;
      },
      validate: (input) => {
        const { error } = applicationProps.name.required().validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'input',
      name: 'key',
      message: 'Enter the application key',
      default: ({ name }) => sluggify(name),
      filter: (input) => {
        const { value } = applicationProps.key.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error } = applicationProps.key.required().validate(input);
        if (error) return error;

        const doc = await repos.$('application').findByKey({
          key: input,
          options: { projection: { _id: 1 } },
        });
        if (doc) return new Error('An application already exists with this key');
        return true;
      },
    },
    {
      type: 'input',
      name: 'roles',
      message: 'Enter comma separated list of roles the application supports',
      default: 'Administrator, Member',
      filter: (list) => list.split(',').map((v) => v.trim()).filter((v) => v),
      validate: (roles) => {
        const { error } = applicationProps.roles.validate(roles);
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
    name,
    key,
    roles,
  } = await inquirer.prompt(questions);
  return confirm ? repos.$('application').create({ name, key, roles }) : null;
};
