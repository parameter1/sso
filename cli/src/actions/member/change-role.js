import inquirer from 'inquirer';
import { memberProps } from '@parameter1/sso-mongodb-command';

import { getWorkspaceList } from '../utils/index.js';
import { commands } from '../../service-clients.js';

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
          '_edge.application.node.roles': 1,
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
      message: 'Select the user',
      choices: ({ workspace }) => workspace._connection.member.edges.map(({ node, role }) => ({
        name: `${node.familyName}, ${node.givenName} [${node.email}]`,
        value: { node, role },
      })),
    },

    {
      type: 'list',
      name: 'role',
      message: 'Select the manager role',
      choices: ({ user, workspace }) => workspace._edge.application.node.roles.map((role) => ({
        name: role === user.role ? `${role} (current role)` : role,
        value: role,
        disabled: role === user.role,
      })),
      filter: (input) => {
        const { value } = memberProps.role.required().validate(input);
        return value;
      },
      validate: (input) => {
        const { error } = memberProps.role.required().validate(input);
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
    role,
    user,
    workspace,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  return commands.request('member.changeRole', {
    input: [{ entityId: { workspace: workspace._id, user: user.node._id }, role }],
    awaitProcessing: true,
  });
};
