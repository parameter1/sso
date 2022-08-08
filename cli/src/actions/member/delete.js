import inquirer from 'inquirer';
import { getWorkspaceList, waitUntilProcessed } from '../utils/index.js';
import { entityManager } from '../../mongodb.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'workspace',
      message: 'Select the workspace',
      // only return orgs with managers
      choices: () => getWorkspaceList({
        query: { '_connection.member.edges.node._id': { $exists: true } },
        projection: {
          '_connection.member.edges': {
            $sortArray: {
              input: '$_connection.member.edges',
              sortBy: { 'node.slug.reverse': 1, 'node._id': 1 },
            },
          },
        },
      }),
    },

    {
      type: 'list',
      name: 'user',
      message: 'Select the user to remove as a member',
      choices: ({ workspace }) => workspace._connection.member.edges.map(({ node, role }) => ({
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
    workspace,
    user,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  const handler = entityManager.getCommandHandler('member');
  return waitUntilProcessed(() => handler.delete({
    entityId: { workspace: workspace._id, user: user._id },
  }));
};
