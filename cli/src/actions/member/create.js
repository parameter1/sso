import inquirer from 'inquirer';
import { memberProps } from '@parameter1/sso-mongodb-command';

import { getWorkspaceList, getUserList } from '../utils/index.js';
import { memberCommands, materializedRepoManager } from '../../mongodb.js';
import { waitUntilProcessed } from '../../pubsub.js';

export default async () => {
  const questions = [
    {
      type: 'list',
      name: 'workspace',
      message: 'Select the workspace',
      choices: () => getWorkspaceList({
        projection: { '_edge.application.node._id': 1 },
      }),
    },
    {
      type: 'list',
      name: 'user',
      message: 'Select the user',
      choices: async ({ workspace }) => getUserList({
        query: { '_connection.workspace.edges._id': { $ne: workspace._id } },
      }),
    },
    {
      type: 'list',
      name: 'role',
      message: 'Select the member role',
      choices: async ({ workspace }) => {
        const doc = await materializedRepoManager.get('application').collection.findOne({
          _id: workspace._edge.application.node._id,
        }, { projection: { roles: 1 } });
        if (!doc) return new Error('No application was found for the provided ID.');
        return doc.roles;
      },
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
    workspace,
    user,
    role,
  } = await inquirer.prompt(questions);
  if (!confirm) return null;

  return waitUntilProcessed(() => memberCommands.createOrRestore({
    input: [{ entityId: { user: user._id, workspace: workspace._id }, values: { role } }],
  }));
};
