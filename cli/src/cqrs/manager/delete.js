import inquirer from 'inquirer';
import { getOrgList, waitUntilProcessed } from '../utils/index.js';
import { entityManager } from '../../mongodb.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'org',
      message: 'Select the organization',
      // only return orgs with managers
      choices: () => getOrgList({
        query: { 'managerConnection.edges.node._id': { $exists: true } },
        projection: {
          'managerConnection.edges': {
            $sortArray: {
              input: '$managerConnection.edges',
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
      choices: ({ org }) => org.managerConnection.edges.map(({ node, role }) => ({
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

  const handler = entityManager.getCommandHandler('manager');
  return waitUntilProcessed(() => handler.delete({
    entityId: { org: org._id, user: user._id },
  }));
};
