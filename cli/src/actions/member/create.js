import inquirer from 'inquirer';
import { memberCommandProps } from '@parameter1/sso-mongodb';
import { getUserList, getWorkspaceList, waitUntilProcessed } from '../utils/index.js';
import { entityManager } from '../../mongodb.js';

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
        const doc = await entityManager.getMaterializedRepo('application').findByObjectId({
          id: workspace._edge.application.node._id,
          options: { strict: true, projection: { roles: 1 } },
        });
        return doc.roles;
      },
      filter: (input) => {
        const { value } = memberCommandProps.role.required().validate(input);
        return value;
      },
      validate: (input) => {
        const { error } = memberCommandProps.role.required().validate(input);
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

  const handler = entityManager.getCommandHandler('member');
  return waitUntilProcessed(() => handler.createOrRestore({
    entityId: {
      user: user._id,
      workspace: workspace._id,
    },
    values: { role },
  }));
};
