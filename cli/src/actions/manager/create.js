import inquirer from 'inquirer';
import { managerCommandProps } from '@parameter1/sso-mongodb';
import { getOrgList, getUserList, waitUntilProcessed } from '../utils/index.js';
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
      type: 'list',
      name: 'user',
      message: 'Select the user',
      choices: async ({ org }) => getUserList({
        query: { '_connection.organization.edges.node._id': { $ne: org._id } },
      }),
    },

    {
      type: 'list',
      name: 'role',
      message: 'Select the manager role',
      choices: () => ['Owner', 'Administrator', 'Manager'],
      filter: (input) => {
        const { value } = managerCommandProps.role.required().validate(input);
        return value;
      },
      validate: (input) => {
        const { error } = managerCommandProps.role.required().validate(input);
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
    user,
    role,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  const handler = entityManager.getCommandHandler('manager');
  return waitUntilProcessed(() => handler.createOrRestore({
    entityId: {
      org: org._id,
      user: user._id,
    },
    values: { role },
  }));
};
