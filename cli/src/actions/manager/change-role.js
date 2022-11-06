import inquirer from 'inquirer';
import { managerProps } from '@parameter1/sso-mongodb-command';

import { getOrgList } from '../utils/index.js';
import { managerCommands } from '../../mongodb.js';
import { waitUntilProcessed } from '../../pubsub.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      // only return orgs with managers
      choices: () => getOrgList({
        query: { '_connection.manager.edges.node._id': { $exists: true } },
        projection: {
          '_connection.manager.edges': {
            $sortArray: {
              input: '$_connection.manager.edges',
              sortBy: { 'node.slug.reverse': 1, 'node._id': 1 },
            },
          },
        },
      }),
    },

    {
      type: 'list',
      name: 'user',
      message: 'Select the user',
      choices: ({ org }) => org._connection.manager.edges.map(({ node, role }) => ({
        name: `${node.familyName}, ${node.givenName} [${node.email}]`,
        value: { node, role },
      })),
    },

    {
      type: 'list',
      name: 'role',
      message: 'Select the manager role',
      choices: ({ user }) => ['Owner', 'Administrator', 'Manager'].map((role) => ({
        name: role === user.role ? `${role} (current role)` : role,
        value: role,
        disabled: role === user.role,
      })),
      filter: (input) => {
        const { value } = managerProps.role.required().validate(input);
        return value;
      },
      validate: (input) => {
        const { error } = managerProps.role.required().validate(input);
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

  return waitUntilProcessed(() => managerCommands.changeRole({
    input: [{ entityId: { org: org._id, user: user.node._id }, role }],
  }));
};
