import inquirer from 'inquirer';
import { organizationProps } from '@parameter1/sso-mongodb-command';

import getOrgList from '../utils/get-org-list.js';
import { commands } from '../../service-clients.js';

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
        const { value } = organizationProps.name.required().validate(input);
        return value;
      },
      validate: async (input) => {
        const { error } = organizationProps.name.validate(input);
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

  return commands.request('organization.changeName', {
    input: [{ entityId: org._id, name }],
    awaitProcessing: true,
  });
};
