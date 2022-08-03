import inquirer from 'inquirer';
import { organizationCommandProps } from '@parameter1/sso-mongodb';
import { getOrgList, waitUntilProcessed } from '../utils/index.js';
import { entityManager } from '../../mongodb.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      choices: getOrgList,
    },
    {
      type: 'input',
      name: 'name',
      default: ({ org }) => org.name,
      message: 'Enter the new organization name',
      filter: (input) => {
        const { value } = organizationCommandProps.name.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error } = organizationCommandProps.name.validate(input);
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
    org,
    name,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  const handler = entityManager.getCommandHandler('organization');
  return waitUntilProcessed(() => handler.changeName({
    entityId: org._id,
    name,
  }));
};
