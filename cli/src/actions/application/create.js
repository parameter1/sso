import inquirer from 'inquirer';
import { sluggify } from '@parameter1/slug';
import { applicationProps } from '@parameter1/sso-mongodb-command';

import { materializedRepoManager } from '../../mongodb.js';
import { commands } from '../../service-clients.js';

const repo = materializedRepoManager.get('application');

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
        const { error, value } = applicationProps.key.required().validate(input);
        if (error) return error;
        const doc = await repo.findByKey(value, {
          projection: { _id: 1 },
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
  if (!confirm) return null;

  return commands.request('application.create', {
    input: [{ values: { name, key, roles } }],
    awaitProcessing: true,
  });
};
