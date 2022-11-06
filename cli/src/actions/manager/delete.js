import inquirer from 'inquirer';

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
      message: 'Select the user to remove as a manager',
      choices: ({ org }) => org._connection.manager.edges.map(({ node, role }) => ({
        name: `${node.familyName}, ${node.givenName} [${node.email}] - ${role}`,
        value: node,
      })),
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
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  return waitUntilProcessed(() => managerCommands.delete({
    input: [{ entityId: { org: org._id, user: user._id } }],
  }));
};
