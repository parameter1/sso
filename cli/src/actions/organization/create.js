import inquirer from 'inquirer';
import { sluggify } from '@parameter1/slug';
import { organizationCommandProps } from '@parameter1/sso-mongodb';
import { entityManager } from '../../mongodb.js';
import { waitUntilProcessed } from '../utils/index.js';

export default async () => {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter the organization name',
      filter: (input) => {
        const { value } = organizationCommandProps.name.required().validate(input);
        return value;
      },
      validate: (input) => {
        const { error } = organizationCommandProps.name.required().validate(input);
        if (error) return error;
        return true;
      },
    },
    {
      type: 'input',
      name: 'key',
      message: 'Enter the organization slug key',
      default: ({ name }) => sluggify(name),
      filter: (input) => {
        const { value } = organizationCommandProps.key.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error, value } = organizationCommandProps.key.required().validate(input);
        if (error) return error;
        const doc = await entityManager.getMaterializedRepo('organization').findByKey({
          key: value,
          options: { projection: { _id: 1 } },
        });
        if (doc) return new Error('An organization already exists with this key');
        return true;
      },
    },
    {
      type: 'input',
      name: 'emailDomains',
      message: 'Enter comma separated list of organization email domains',
      filter: (list) => {
        const domains = list.split(',').map((v) => v.trim()).filter((v) => v);
        const { value } = organizationCommandProps.emailDomains.validate(domains);
        return value;
      },
      validate: (domains) => {
        const { error } = organizationCommandProps.emailDomains.validate(domains);
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
    emailDomains,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  const handler = entityManager.getCommandHandler('organization');
  return waitUntilProcessed(() => handler.create({
    values: { name, key, emailDomains },
  }));
};
